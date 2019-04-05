The files in this directory are used to generate the model files.

## Pre-processing
* dataCleaning.js - create a cleaned version of the data with the color names standardized: cleaned_color_names.csv
* getBasicFullColorInfo.js - Extract some basic info about colors (num records, most common version of name) into basic_color_info.csv

## Binned data and translation loss
* getFullColorNames.js - takes the pre-processed files and generates binned info on each color name
* getTranslation.js - creates the distanceMatrix.json file used by getEMDparallel.py to generate the translation_loss files. Depends on the full_color_names.json file
* getEMDparallel.py (very slow!) - finds the earth mover distance for color terms, and creates the translation_loss files. Depends on th fullColorNames_ files and the distanceMatrix.json file.

## SOMs

* createColorSOMs.js - creates SOMs for each color term. depends on cleaned_fullRGB_color_names.csv and uses translation_loss files to figure out which terms to do (probably bad)
