# Binned Full Colors

This folder has datasets from our binning all the color names given in LAB color space.

See [Full Color Maps](https://idl.uw.edu/color-naming-in-different-languages/vis/full_color_maps.html)
![A screenshot of the full colors in different languages, with groups of binned colors and different levels of brightness](../../vis/color-maps-small.png)

## Blur / No-Blur
For each file of binned data, there is also a blurred version, where a small gaussian blur was run on all 3x3x3 grids of tiles to smooth out the naming data.

## Full Color Language Bin Info
The "full_color_lang_bin_info.csv" and "full_color_lang_bin_blur_info.csv" file have statistics on our binning of languages into our different LAB bin sizes.

Fields:
- **lang:** The language of the color term (long form)
- **langAbv:** Two letter abbreviation of the language
- **num_bins_X:** The number of bins (size X) that we kept for this language (we require enough data in a bin to keep info about it)
- **fraction_bins_X:** The fraction of bins (size X) that we kept for this language. This gives an indication of how much data we had for the language and if we have enough bins to make meaningful calculations and visualizations at this bin size

Created by:
- processing_scripts/02_initial_processing/03_getFullColorNames.js


## Full Color Names Binned
The "full_color_names_binned_X.csv" files has info for each language/term/bin.

The file is a flat array of JSON objects for each combination of language/term/bin. It contains the following fields:
- **lang:** Language (long version)
- **langAbv:** Two letter abbreviation of the language
- **binL/binA/binB:** Index of Color Bin
- **term:** the simplified matching color name ("name" from cleaned_color_names.csv)
- **CommonColorName:** The commonName for that color term
- **cnt:** The number of times this term was given to that bin
- **correctedCnt:** A count that is corrected for the expected percentage of hue colors in this bin (since we collected extra hue colors in the "line" data)
- **pCT:** Probability of this color bin (c) given this term (t) (P(c|t))
- **pTC:** Probability of this term (t) given this color bin (c) (P(t|c))

Created by:
- processing_scripts/02_initial_processing/03_getFullColorNames.js

## Binned Full Color Saliencies Map
The "full_color_map_saliency_bins_X.json" files contains summary color naming information about each bin (bin size X) for each language.

- **lang:** Language (long version)
- **langAbv:** Two letter abbreviation of the language
- **binL/binA/binB:** Index of Color Bin
- **lab:** A string of the representative LAB value for this bin (center if it maps to valid rgb, otherwise closest valid rgb in bin to center of bin)
- **saliency:** The saliency (negative entropy base-2) of color naming in this bin
- **maxpTC:** The maximum probability of a term (t) given this color bin (c) (P(t|c)), that is the P(t|c) for the most common color name for this bin. (correcting for expected hue value ratio of this bin)
- **majorTerm:** The most common simplified matching term used for this bin (correcting for expected hue value ratio of this bin)
- **commonTerm:** The most common standardized name for the majorTerm
- **avgTermColor:** The average rgb color value for the majorTerm
- **topTerms:** An array of the top terms used for this bin, containing:
  - **term:** The simplified matching term
  - **commonTerm:** The most common standardized name for this term
  - **pTC:**  Probability of this term (t) given this color bin (c) (P(t|c))

Created by:
- processing_scripts/02_initial_processing/03_getFullColorNames.js