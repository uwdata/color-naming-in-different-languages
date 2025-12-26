# Stage 0: Pre-processing colors

These scripts are to calculate things about colors and color spaces before considering any color naming.

## hueColorGenerator.js
This script generates an Oklab uniformly spaced color ring of the hue colors (RGBs with at least one 0 and one [255 or 1]). We use this in picking colors for our "line" data in our study, and for displaying the hue color data. We do this for different color spaces: sRGB, p3 and rec2020

Data Outputs:
- model/color_info_pre_naming/hue_colors_*.json

## 01_createLABBins.js
This script calculates properties of the Oklab bins we use for binning colors

Data Outputs:
- model/color_info_pre_naming/oklab_bins_*.json

Constants:
- LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES: Use all the bin sizes listed in the labBinHelper (e.g., cube bins, box bins, Oklch ring bins)

- COLOR_SPACES = ['srgb', 'p3', "rec2020"]: The color spaces to use when creating bins.

Note: if you want to run it fast for testing, "change color_step" to a larger number, like 15

## 02_LABBinSpaceEstimate.js
This script estimates what percentage of Oklab space in each color bin, and also trying to find better representative colors for the bin in each color space. It updates the bin files

Data Inputs:
- model/color_info_pre_naming/oklab_bins_*.json

Data Outputs:
- model/color_info_pre_naming/oklab_bins_*.json

Constants:
- const LAB_N_SAMPLES = 500: How many divisions to make when sampling the l/a/b space of Oklab

