# WISE
Water body Index-based Sentinel-2 Extraction

This repository contains the code used in the research article:  
**"Automated Extraction and Monitoring of Surface Water Bodies Using Sentinel-1 and Sentinel-2 Imagery in the Google Earth Engine Cloud Environment"**.

## 🔍 Description

This project presents an automated methodology for surface water body extraction based on spectral indices (NDWI, MNDWI, AWEIsh, WRI) from Sentinel-2 data. It also includes accuracy validation using Sentinel-1 SAR imagery and comparisons with orthophoto data.

The script is implemented in **Google Earth Engine (GEE)** and supports temporal analysis from **2018 to 2023**.

## 🛰️ Data Sources

- **Sentinel-2 MSI**: optical imagery from ESA (via GEE catalog)
- **Sentinel-1 SAR**: radar imagery from ESA (via GEE catalog)
- **Orthophotos**: provided by Geodetic and Cartographic Institute Bratislava (GKÚ) and the National Forestry Centre (NLC)

## ⚙️ Methodology Overview

- Selection of cloud-free Sentinel-2 images (<20% cloud cover)
- Calculation of water indices: `NDWI`, `MNDWI`, `AWEIsh`, `WRI`
- Thresholding and water mask generation (with optional Otsu method)
- Accuracy assessment using Sentinel-1 (VH and VV polarization)
- Validation against orthophotos

## 📁 Structure
