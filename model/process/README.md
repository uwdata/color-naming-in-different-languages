The files in this directory are used to generate the model files.

Binned data and translation loss
* getFullColorNames.js - takes the raw file (raw/color_perception_table_color_names.csv) and generates binned info on each color name
* getTranslation.js - creates the distanceMatrix.json file used by getEMDparallel.py to generate the translation_loss files. Depends on the full_color_names.json file
* getEMDparallel.py - finds the earth mover distance for color terms, and creates the translation_loss files. Depends on th fullColorNames_ files and the distanceMatrix.json file.

SOMs
* dataCleaning.js - create a cleaned version of the data with the color names standardized
* createColorSOMs.js - creates SOMs for each color term. depends on cleaned_fullRGB_color_names.csv and uses translation_loss files to figure out which terms to do (probably bad)
