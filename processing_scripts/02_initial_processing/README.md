# Stage 2: Initial Processing

These scripts take the cleaned color name data and processes it to get various summaries of color names and color bins.

## 01_getBasicFullColorInfo.js
This script calculates general information about colors using all the color naming data: users who were asked to name colors from the full rgb set or from the hue line (we re-weigh the hue line data to make all data evenly weighted in LAB color space.)

Data Outputs:
- model/full_colors_info.csv
- model/lang_info.csv

Data Inputs:
- model/color_info_pre_naming/lab_hue_color_ratio.json
- model/cleaned_color_names.csv

Constants:
- MIN_FULL_COLOR_NAMES = 12: For each language, the number of names from the full color data collection needed to include a color name in the output

## 02_getHueColorNames.js
This script bins all the data from users we showed line data (hue colors)

Data outputs:
- model/binned_hue_colors/hue_color_names_binned_aggregated.json
- model/binned_hue_colors/hue_color_names_binned.json

Data Inputs:
- model/cleaned_color_names.csv

Constants:
- N_BINS = 36: how many bins to divide the hue color line into
- N_TERMS = 20: The output contains the top N_TERMS color names from each language
- MIN_COUNT = 400: The minimum number of color names needed in a language for it to be included in the output

## 03_getFullColorName.js
This script processes all color names in the full color space, producing binned data for each language.

Data outputs:
- model/binned_full_colors/full_color_names_binned_*.json
- model/binned_full_colors/full_color_map_saliency_bins*.json

Data Inputs:
- model/cleaned_color_names.csv
- model/full_colors_info.csv
- model/lang_info.csv

Constants:
- MIN_NperBin = 4: For each language: the number of color names in a bin we require to output data for that bin

