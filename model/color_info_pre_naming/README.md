# Color Calculations (without color names)

In order to calculate color distances and generate color bins, we use the perceptually uniform [Oklab color space](https://en.wikipedia.org/wiki/Oklab_color_space) (e.g., perceptual distance matches the standard Euclidean distance).


## Hue Colors
"hue_colors_*.json" files contains each hue color in each color space (max(r,g,b) == [255 or 1] && min(r,g,b) == 0) lined up in order (red, orange, yellow,..., purple, red), with OKLAB distance calculations between each one. Used both for collecting color names and displaying hue colors.

![The hue colors](../../vis/hue-colors-small.png)

Fields:
- **rgb:** An object with the r, g, and b values for the color
- **lab:** An object with the l, a, and b values for the color
- **cumulative_dist:** The cumulative distance from the first hue color to the current one
- **next_dist:** The LAB distance between the current hue value and the next

Created by:
- processing_scripts/00_pre-processing-colors/hueColorGenerator.js

## Lab Bins
The "lab_bins_*.json" files have information on Oklab bins at different bin sizes (0.1, 0.05) and types (e.g., normal cubes or boxes, or Oklch "ring"s). All the bins in a file are uniform size in Oklab space. Since Lightness ranges from 0 to 1, and a and b (or c and h) ranges vary along lightness levels, we have chosen to arrange the bins to have one bin centered at Oklab 0,0,0 and one at Oklab 100,0,0. The bins branch out from there (in a grid for cubes or boxes, or with arc bins in "ring" type).

Some bins include Oklab values that don't map into some or all of the color spaces we used and may not even represent real possible colors. If the center of the bin isn't in the a color space we a representative color for the bin (from the bin if possible, otherwise the closest valid color to the center of the bin).

See the [full color bin viewer](https://idl.uw.edu/color-naming-in-different-languages/vis/full-color-bins-viewer.html) to see the binning options.

Fields:

The json data is an array of bins. Each has the following fields
- **l_bin, a_bin, b_bin OR l_bin, c_bin, h_bin:** the bin number (in lab or lch depending on bin type)
- **l_min, a_min, b_min OR l_min, c_min, h_min:** the minimum values for l, a, and b, or l, c, and h in this bin
- **l_center, a_center, b_center OR l_center, c_center, g_center:** the center l, a, and b or l, a, and b, or l, c, and h values in this bin
- **l_max, a_max, b_max OR l_center, c_center, g_center:** the maximum values for l, a, and b, or l, c, and h values in this bin
- **center_rgb/p3/rec2020:** an object with the r,g,b values for the center of the bin in the given color space (may not be a valid color in that space)
- **center_rgb/p3/rec2020_in_other_bin:** Due to rounding, the center value of this bin in a color space might map back to another bin. This indicates that the rounded center of this bin belongs in another bin.
- **representative_rgb/p3/rec2020:** If the center of this bin wasn't a valid color in the given color space, then this is an object with r,g,b values that is the representative color for this bin (the representative color might not be in this bin)
- **representative_rgb/p3/rec2020_from_bin:** This is "true" if the representative color was a translation of an Oklab value within this bin into the given color space. 
- **representative_rgb/p3/rec2020_in_this_bin:** Because of rounding in color spaces, a color from an Oklab value in this bin, when translated back into Oklab might belong to another bin. We try to choose a representative color that is from this bin and when translated back into Oklab is still in this bin (in which case this value is "true"). This is "false" if the representative color, translated to Oklab, is in a different bin.
- **representative_lab:** An object with l,a,b values that is the representative color for this bin (we try to choose a value based on the representative rgb/p3/rec2020 colors translated back to Oklab, and od those, the closest to the center). 
- **num_rgb/p3/rec2020:** The number of color space values that map into this bin (we use 256x256x256 values for r,g, and b in each color space, which is only all colors in sRGB).
- **ratio_bin_in_gamut_rgb/p3/rec2020:**: An estimate of what ratio of Oklab values in this bin map to valid colors in the given color space (here we ignore that the mapped-to colors might go to a different bin when translated back to Oklab)
- **gamut_ratio_sample_lab_delta:** The sample size (in Oklab space) used when estimating the ratio_bin_in_gamut

Created by:
- processing_scripts/00_pre-processing-colors/01_createLABBins.js
- processing_scripts/00_pre-processing-colors/02_LABBinSpaceEstimate.js
