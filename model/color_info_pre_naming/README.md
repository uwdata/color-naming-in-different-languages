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
The "lab_bins_*.json" files have information on Oklab bins at different bin sizes (0.1, 0.05) and types (e.g., normal cubes or boxes, or Oklch "ring"s). All the bins in a file are uniform size in Oklab space. Since Lightness ranges from 0 to 1, and a and b vary along lightness, we have chosen to arrange the bins to have one bin centered at Oklab 0,0,0 and one at Oklab 100,0,0.

Some bins include Oklab values that don't map into an particular color space and may not even represent real colors. If the center of the bin isn't in the a color space we a representative color for the bin (from the bin if possible, otherwise the closest valid color to the center of the bin).

See the [full color bin viewer](https://idl.uw.edu/color-naming-in-different-languages/vis/full-color-bins-viewer.html) to see the binning options.

Fields:

"l_bin": 0,
    "a_bin": 0,
    "b_bin": 1,
    "l_center": 0,
    "l_min": -0.05,
    "l_max": 0.05,
    "a_center": 0,
    "a_min": -0.05,
    "a_max": 0.05,
    "b_center": 0.1,
    "b_min": 0.05,
    "b_max": 0.15000000000000002,
    "center_lab": {
      "l": 0,
      "a": 0,
      "b": 0.1
    },
    "center_p3": {
      "r": -0.0031866956048855048,
      "g": 0.008820826773664114,
      "b": -0.0426236076218641
    },
    "center_rec2020": {
      "r": -0.0009339519825094888,
      "g": 0.002657048069842685,
      "b": -0.014571758691203075
    },
    "representative_lab": {
      "l": 0.032000000000000084,
      "a": 3.7470027081099033e-16,
      "b": 0.05800000000000041
    },
    "representative_p3": {
      "r": 0,
      "g": 0,
      "b": 0
    },
    "representative_p3_from_bin": false,
    "representative_p3_in_this_bin": false,
    "num_p3": 0,
    "representative_rec2020": {
      "r": 0,
      "g": 0,
      "b": 0
    },
    "representative_rec2020_from_bin": false,
    "representative_rec2020_in_this_bin": false,
    "num_rec2020": 0,
    "center_rgb": {
      "r": -2,
      "g": 2,
      "b": -12
    },
    "representative_rgb": {
      "r": 1,
      "g": 0,
      "b": 0
    },
    "representative_rgb_from_bin": true,
    "representative_rgb_in_this_bin": false,
    "num_rgb": 0,
    "gamut_ratio_sample_lab_delta": 0.002,
    "ratio_bin_in_gamut_rgb": 0.023056,
    "ratio_bin_in_gamut_p3": 0,
    "ratio_bin_in_gamut_rec2020": 0

The json data is an array of bins. Each has the following fields
- **l_bin, a_bin, b_bin OR l_bin, c_bin, h_bin:** the bin number (in lab or lch depending on bin type)
- **l_min, a_min, b_min OR l_min, c_min, h_min:** the minimum values for l, a, and b, or l, c, and h in this bin
- **l_center, a_center, b_center OR l_center, c_center, g_center:** the center l, a, and b or l, a, and b, or l, c, and h values in this bin
- **l_max, a_max, b_max OR l_center, c_center, g_center:** the maximum values for l, a, and b, or l, c, and h values in this bin
- **center_rgb/p3/rec2020:** an object with the r,g,b values for the center of the bin in the given color space (may not be a valid color in that space)
- **center_rgb/p3/rec2020_in_other_bin:** Due to rounding, the center value of this bin in a color space might map back to another bin. This indicates that the rounded center of this bin belongs in another bin.
- **representative_rgb/p3/rec2020:** If the center of this bin wasn't a valid color in the given color space, then this is an object with r,g,b values that is the representative color for this bin
- **representative_rgb/p3/rec2020_from_bin**
- **representative_rgb/p3/rec2020_in_this_bin**
- **representative_lab:** an object with l,a,b values that is the representative color for this bin (same as center if possible, but if not, the lab value matching the closest rgb value in bin)
- **num_rgb/p3/rec2020:** The number of rgb values that map into this bin *(note: due to rounding rgb values to whole numbers, LAB values in this bin may map to rgb values that map back into another bin, but we only count rgb values that map into this bin)*
- **ratio_bin_in_gamut_rgb/p3/rec2020**
- **gamut_ratio_sample_lab_delta**

Created by:
- processing_scripts/00_pre-processing-colors/01_createLABBins.js
- processing_scripts/00_pre-processing-colors/02_LABBinSpaceEstimate.js
