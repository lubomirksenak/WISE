# WISE 
**W**ater body **I**ndex-based **S**entinel-2 **E**xtraction

This repository contains the code used in the research article:  
**"Evaluation of Automated Water Surface Extraction Using Mul-ti-Source Remote Sensing Data: A Case Study of the Veľká Domaša Reservoir, Slovakia"**.

## 🔍 Description

This project presents an automated methodology for surface water body extraction based on spectral indices (NDWI, MNDWI, AWEIsh, WRI) from Sentinel-2 data. It also includes accuracy validation using Sentinel-1 SAR imagery and comparisons with orthophoto data.

The script is implemented in **Google Earth Engine (GEE)** and supports temporal analysis from **2018 to 2023**.

## 🛰️ Data Sources

- **Sentinel-2 MSI**: optical imagery from ESA (via GEE catalog)
- **Sentinel-1 SAR**: radar imagery from ESA (via GEE catalog)
- **Orthophotos**: provided by Geodetic and Cartographic Institute Bratislava (GKÚ) and the National Forestry Centre (NLC)
- **Hydrological data - water level elevation**: provided by Slovak Water Management Enterprise (SVP š. p.)

## ⚙️ Methodology Overview

- Selection of cloud-free Sentinel-2 images (<20% cloud cover)
- Calculation of water indices: `NDWI`, `MNDWI`, `AWEIsh`, `AWEInsh` and `WRI`
- Thresholding and water mask generation (with optional Otsu method)
- Accuracy assessment using Sentinel-1 (VH and VV polarization) (TBA)
- Validation against orthophotos (TBA)

## 📁 Structure

## ▶️ How to Use

1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Copy and paste the content of `water_extraction.js` into a new GEE script.
3. Modify the parameters as needed (dates, AOI, thresholding method).
4. Run the script and export results if desired.

## 📊 Outputs

- Water area extent 
- Visual water masks
- Accuracy metrics (TBA)

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔗 Citation

If you use this script or data in your research, please cite the corresponding publication (citation to be added upon article acceptance).

## 📬 Contact

For questions or collaboration, contact:  
**Dr. Ľubomír Kseňak**  
Technical university of Košice, Slovakia  
lubomir.ksenak@tuke.sk
