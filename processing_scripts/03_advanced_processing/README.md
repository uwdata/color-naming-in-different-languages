# Stage 3: Advanced Processing

These scripts are use the initial processing data to make more advanced models and calculations.


## getTranslation_01.js 
Creates temp files to hold the distribution of color names in LAB bins and the distanceMatrix of those LAB bins. These are used by getTranslation_02_EMDparallel.py to generate the translation_loss files.

Output Data:
- ./temp/distanceMatrix_*.json
- ./temp/fullColorNames_*_*.json

Input Data:
- model/color_info_pre_naming/lab_bins_*.json
- model/binned_full_colors/full_color_names_binned_*.json
- model/binned_full_colors/full_color_lang_bin_info.csv

Constants:
- LOW_RES_BIN = 20: The size of the low resolution bins to use for comparing sizes if distances are far or data is scarce
- HIGH_RES_BIN = 10: The size of the high resolution bins to use for computing sizes where distance is small and there is enough data (slower)
- MIN_FRACTION_BIN_HIGH_RES = 0.4: The fraction of bins that have to be present in the HIGH_RES_BIN size to be considered usable for calculating color distance


## getTranslation_02_EMDparallel.py
Uses tmp data from step 1 to calculate the translation distance between all pairs of color names. We use Earth Mover's Distance (EMD) in LAB space as our measure of distance. We first calculate distance with low res bins, and then if the distance is small, we switch to higher res bins if available.

This script will skip calculating translations for files that already exist, so if you want to recalculate some or all of the translations, delete the ones you want to calculate and then run the script.

This script is written in python to take advantage of multithreaded programming, since it is slow to calculate all the EMDs.

Output Data:
- model/translation_loss/translation_loss_*.json

Input Data:
- ./temp/distanceMatrix_*.json
- ./temp/fullColorNames_*_*.json

Constants:
- DEFAULT_BIN = '20': the default bin size to use for distance calculations
- HIGH_RES_BIN = '10': the high res bin size to use for more precise calculations in close colors
- HIGH_RES_DIST = 60: the threshold distance for when to switch to high res distance calculation


## getSchemeColorNames.js 
Calculates the color distributions for Korean and English words on different color schemes (viridis, magma, inferno, plasma).

Output Data:
- model/scheme_color_names.json

Input Data:
- model/binned_full_colors/full_color_names_binned_10.json

Constants:
- BIN_NUM = 10: The number of bins to split the color scheme into


## createColorSOMs.js
Creates color patch Self-Organizing Maps for each color in each language. We calculate multiple SOMs to try to find one with better properties (no node is unduly low in representing data), and we rotate and flip the SOMS to try to orient them similarly to make visual comparison easier. 

Output Data:
- model/colorSOMPatches.json

Input Data:
- model/cleaned_color_names.csv
- model/full_colors_info.csv
- model/lang_info.csv

Constants:
MIN_NAMES_FOR_9_SOM = 19: Number of full color names needed to move up from a 2x2 SOM to a 3x3 SOM
MIN_NAMES_FOR_16_SOM = 201: Number of full color names needed to move up from a 3x3 SOM to a 4x4 SOM
SOM_TRAIN_ITERATIONS = 20000: Number of training iterations to run on each SOM

