# Binned Hue Colors

This folder has datasets from our binning the rgb hue line data (bins based on evenly spaced LAB color distances).

Note: RGB Hue colors are defined as colors with max(r,g,b) == 255, min(r,g,b) == 0.

## Hue Color Names Binned
The "hue_color_names_binned.json" file contains information about how the color names fit in the hue color bins. 

This file is an array of JSON objects with fields:
- lang: Language (long version)
- term: Color term simplifiedName
- commonName: The most common standardized name for the color
- binNum: Which bin this is in in the hue data line
- cnt: How many times this color name occurs in this bin
- rank: The popularity rank of this color term in the hue data
- pCT: Probability of a color bin (c) given this term (t) (P(c|t))
- pTC: Probability of this term (t) given this color bin (c) (P(t|c))
- termSubID: Appears to be unused value

Created by:
- processing_scripts/02_initial_processing/02_getHueColorNames.js


## Hue Color Names Binned Aggregated
The "hue_color_names_binned_aggregated.json" file is an aggregate version of hue_color_names_binned.json.

For each language:
- totalCount: The number of hue color names given for this language
- terms: An array of simplifiedNames (index is bin number) 
- commonNames: An array of common names for the terms (index is bin number)
- avgColor: An array of rgb values for the average color of each bin (index is bin number)
- colorNameCount: An array of arrays with the counts of each term in each color bin (I believe first index is bin number, second index is color term number)


Created by:
- processing_scripts/02_initial_processing/02_getHueColorNames.js