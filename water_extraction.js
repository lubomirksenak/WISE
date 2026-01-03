/*==================================================================================
================== WATER BODIES INDEX-BASED SENTINEL-2 EXTRACTION ==================
====================================================================================
--------
Case study:  Veľká Domaša water reservoir, Slovakia
Description: Extraction of surface water using multiple spectral indices 
             and quantification of water extent.

--------
Author:      Ľubomír Kseňak (lubomir.ksenak@tuke.sk)
Platform:    Google Earth Engine (JavaScript API)

--------
Licence:     This code is free and open. By using this code and any data derived 
             with it, you agree to cite the following reference in any publications 
             derived from them:
 
    Ksenak, L. et al., (citation to be added upon article acceptance)
    */


/*==================================================================================
1. STUDY AREA AND TEMPORAL DEFINITION
==================================================================================*/

var geometry = ee.Geometry.Polygon([
  [21.76, 49.00],
  [21.76, 49.11],
  [21.60, 49.11],
  [21.60, 49.00]
]);

Map.centerObject(geometry, 11);
Map.addLayer(geometry, {color: 'red'}, 'ROI');

var startDate = '2018-03-28';
var endDate   = '2018-04-10';


/*==================================================================================
2. SENTINEL-2 DATA PREPROCESSING
==================================================================================*/

// Cloud masking function (QA60)
function maskS2Clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask  = 1 << 10;
  var cirrusBitMask = 1 << 11;

  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image
    .updateMask(mask)
    .divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// Sentinel-2 SR Harmonized collection
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate(startDate, endDate)
  .filterBounds(geometry)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2Clouds);

print('Number of selected Sentinel-2 images:', s2Collection.size());


/*==================================================================================
3. CLOUD PERCENTAGE OVER ROI & BEST IMAGE SELECTION
==================================================================================*/

function addCloudPercROI(image) {
  var cloudMask = image.select('QA60').neq(0);

  var cloudPerc = cloudMask.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 20,
    maxPixels: 1e13
  }).values().get(0);

  return image.set('CLOUD_PERC_ROI', ee.Number(cloudPerc).multiply(100));
}

var s2WithCloudStats = s2Collection.map(addCloudPercROI);

// Best image = minimum cloudiness over ROI
var bestImage = ee.Image(
  s2WithCloudStats.sort('CLOUD_PERC_ROI').first()
);

var sensingDate = ee.Date(bestImage.get('system:time_start'))
  .format('dd MMM yyyy');

print('Best image acquisition date:', sensingDate);
print('Cloud cover over ROI (%):', bestImage.get('CLOUD_PERC_ROI'));

// RGB visualization
Map.addLayer(bestImage.clip(geometry), {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2']
}, 'Sentinel-2 RGB (Best Image)');


/*==================================================================================
4. WATER INDICES CALCULATION
==================================================================================*/

// NDWI (McFeeters, 1996)
var ndwi = bestImage.normalizedDifference(['B3', 'B8']).rename('NDWI');

// MNDWI (Xu, 2006)
var mndwi = bestImage.normalizedDifference(['B3', 'B11']).rename('MNDWI');

// AWEI (Feyisa et al., 2014)
var awei_nsh = bestImage.expression(
  'B3 - B11 - (0.2 * B8 + 2.75 * B12)', {
    B3: bestImage.select('B3'),
    B8: bestImage.select('B8'),
    B11: bestImage.select('B11'),
    B12: bestImage.select('B12')
}).rename('AWEI_nsh');

var awei_sh = bestImage.expression(
  'B2 + 2.5 * B3 - 1.5 * (B8 + B11) - 0.25 * B12', {
    B2: bestImage.select('B2'),
    B3: bestImage.select('B3'),
    B8: bestImage.select('B8'),
    B11: bestImage.select('B11'),
    B12: bestImage.select('B12')
}).rename('AWEI_sh');

// WRI (Shen & Li, 2010)
var wri = bestImage.expression(
  '(B3 + B4) / (B8 + B11)', {
    B3: bestImage.select('B3'),
    B4: bestImage.select('B4'),
    B8: bestImage.select('B8'),
    B11: bestImage.select('B11')
}).rename('WRI');


/*==================================================================================
5. THRESHOLDING AND WATER MASKS
==================================================================================*/

var maskNDWI    = ndwi.gte(0.0).selfMask();
var maskMNDWI   = mndwi.gte(0.0).selfMask();
var maskAWEInsh = awei_nsh.gte(0.0).selfMask();
var maskAWEIsh  = awei_sh.gte(0.0).selfMask();
var maskWRI     = wri.gte(1.0).selfMask();

Map.addLayer(maskNDWI.clip(geometry),    {palette: '#1A237E'}, 'NDWI Water');
Map.addLayer(maskMNDWI.clip(geometry),   {palette: '#004D40'}, 'MNDWI Water');
Map.addLayer(maskAWEInsh.clip(geometry), {palette: '#3949AB'}, 'AWEI_nsh Water');
Map.addLayer(maskAWEIsh.clip(geometry),  {palette: '#2E7D32'}, 'AWEI_sh Water');
Map.addLayer(maskWRI.clip(geometry),     {palette: '#F9A825'}, 'WRI Water');


/*==================================================================================
6. WATER AREA CALCULATION
==================================================================================*/

function calculateWaterArea(mask) {
  return ee.Number(
    mask.multiply(ee.Image.pixelArea())
      .reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e13
      })
      .values()
      .get(0)
  ).divide(1e6); // km²
}

print('Water area NDWI (km²):',    calculateWaterArea(maskNDWI));
print('Water area MNDWI (km²):',   calculateWaterArea(maskMNDWI));
print('Water area AWEI_nsh (km²):',calculateWaterArea(maskAWEInsh));
print('Water area AWEI_sh (km²):', calculateWaterArea(maskAWEIsh));
print('Water area WRI (km²):',     calculateWaterArea(maskWRI));


/*==================================================================================
7. CSV EXPORT – TIME SERIES
==================================================================================*/

function imageToFeature(image) {

  var ndwi  = image.normalizedDifference(['B3', 'B8']).gte(0.0);
  var mndwi = image.normalizedDifference(['B3', 'B11']).gte(0.0);

  var awei_nsh = image.expression(
    'B3 - B11 - (0.2 * B8 + 2.75 * B12)', {
      B3: image.select('B3'),
      B8: image.select('B8'),
      B11: image.select('B11'),
      B12: image.select('B12')
  }).gte(0.0);

  var awei_sh = image.expression(
    'B2 + 2.5 * B3 - 1.5 * (B8 + B11) - 0.25 * B12', {
      B2: image.select('B2'),
      B3: image.select('B3'),
      B8: image.select('B8'),
      B11: image.select('B11'),
      B12: image.select('B12')
  }).gte(0.0);

  var wri = image.expression(
    '(B3 + B4) / (B8 + B11)', {
      B3: image.select('B3'),
      B4: image.select('B4'),
      B8: image.select('B8'),
      B11: image.select('B11')
  }).gte(1.0);

  return ee.Feature(null, {
    date: ee.Date(image.get('system:time_start')).format('YYYY-MM-dd'),
    NDWI_km2: calculateWaterArea(ndwi),
    MNDWI_km2: calculateWaterArea(mndwi),
    AWEI_nsh_km2: calculateWaterArea(awei_nsh),
    AWEI_sh_km2: calculateWaterArea(awei_sh),
    WRI_km2: calculateWaterArea(wri),
    cloud_perc_roi: image.get('CLOUD_PERC_ROI')
  });
}

var waterStatsFC = s2WithCloudStats
  .map(imageToFeature)
  .filter(ee.Filter.notNull(['NDWI_km2']));

Export.table.toDrive({
  collection: waterStatsFC,
  description: 'Domasa_WaterArea_TimeSeries_2018',
  fileFormat: 'CSV'
});


/*==================================================================================
OPTIONAL: EXPORT MULTI-BAND MASK IMAGE FOR BEST IMAGE
==================================================================================*/
/*
// Stack all 5 water masks into a single multi-band image
var multiMaskImage = maskNDWI
  .addBands(maskMNDWI)
  .addBands(maskAWEInsh)
  .addBands(maskAWEIsh)
  .addBands(maskWRI)
  .rename(['NDWI','MNDWI','AWEI_nsh','AWEI_sh','WRI'])
  .clip(geometry);

// Optional export
Export.image.toDrive({
  image: multiMaskImage,
  description: 'Domasa_WaterMasks_5Bands_' + ee.Date(bestImage.get('system:time_start')).format('YYYY-MM-dd').getInfo(),
  region: geometry,
  scale: 10,
  crs: 'EPSG:32634',
  maxPixels: 1e13
});
*/
