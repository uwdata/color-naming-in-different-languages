# Stage 0: Pre-processing colors

These scripts are to calculate things about colors and color spaces before considering any color naming.

## hueColorGenerator.js
This script generates an LAB uniformly spaced color ring of the hue colors (RGBs with at least one 0 and one 255). We use this in picking colors for our "line" data in our study, and for displaying the hue color data.

Data Outputs:
- model/color_info_pre_naming/hue_colors.json


## estimateHueColorPercentage.js
This script estimates what percentage of LAB space is RGB hue colors vs. RGB non-hue colors. This is used for rebalancing the naming data since some of the data is collected specifically from the hue colors.

Data Outputs:
- model/color_info_pre_naming/lab_hue_color_ratio.json

Constants:
- LAB_DELTA LAB_DELTA = .01: 


## createLABBins.js
This script calculates properties of the LAB bins we use for binning colors

Data Outputs:
- model/color_info_pre_naming/lab_bins_*.json


Constants:
- HUE_RATIO_LAB_DELTA = .05: This is the step size to use when estimating what proportion of each LAB bin are hue colors, so that we can re-balance color names given that the "line" color data we collect is just those hue colors. Note: This runs very slow at .05 LAB delta size.