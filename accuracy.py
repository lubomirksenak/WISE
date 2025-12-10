import rasterio
import numpy as np
from rasterio.enums import Resampling
from sklearn.metrics import confusion_matrix, cohen_kappa_score

# Function to load a binary mask from a TIFF file
def load_mask(file_path, threshold=0.3):
    with rasterio.open(file_path) as src:
        data = src.read(1)  # Read the first (only) band
        mask = np.where(data > threshold, 1, 0)  # Create a binary mask based on threshold
    return mask

# Load reference data (ground truth based on NDWI)
truth = load_mask("mask_AWEIsh_2021_03_27.tif", threshold=0.3)  # Assuming NDWI is used for water extraction

with rasterio.open("predicted_mask_2021_VV.tif") as src:
    predicted = src.read(1)
    predicted_meta = src.meta  # Save prediction metadata

# Load prediction and adjust dimensions if necessary
with rasterio.open("mask_AWEIsh_2021_03_27.tif") as src:
    truth_meta = src.meta  # Save reference data metadata

if truth_meta['width'] != predicted_meta['width'] or truth_meta['height'] != predicted_meta['height']:
    with rasterio.open("predicted_mask_2021_VV.tif") as src:
        predicted_resampled = src.read(
            1, 
            out_shape=(truth_meta['height'], truth_meta['width']),
            resampling=Resampling.nearest)  # Or use another resampling method as needed
    predicted = predicted_resampled
    predicted = np.where(predicted == 255, 1, 0)

# Check dimensions
if truth.shape != predicted.shape:
    raise ValueError("Image dimensions do not match!")

# Convert 2D arrays to 1D vectors
y_true = truth.flatten()  # True values (ground truth)
y_pred = predicted.flatten()  # Predicted values (water extraction)

# Compute confusion matrix
cm = confusion_matrix(y_true, y_pred)
TP, FN, FP, TN = cm[1, 1], cm[1, 0], cm[0, 1], cm[0, 0]

# Compute metrics with zero-division checks
OA = (TP + TN) / (TP + TN + FP + FN)  # Overall Accuracy

# Check denominators for PA and UA
PA = TP / (TP + FN) if (TP + FN) != 0 else np.nan  # Producer's Accuracy (Recall)
UA = TP / (TP + FP) if (TP + FP) != 0 else np.nan  # User's Accuracy (Precision)

kappa = cohen_kappa_score(y_true, y_pred)  # Kappa coefficient

# Print results
print(f"Overall Accuracy (OA): {OA:.3f}")
print(f"Producer's Accuracy (PA): {PA:.3f}")
print(f"User's Accuracy (UA): {UA:.3f}")
print(f"Kappa coefficient: {kappa:.3f}")

print("Confusion Matrix:")
print(cm)
print("Unique values in predicted mask:", np.unique(predicted))
