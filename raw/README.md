## Column Info

### color_names.csv
- participantId : Participant ID (note: many participant IDs were saved as 0 due to an error in the study code)
- lang : Language of a color name
- name : Color name entered by participant
- colorSpace : The display gamut used to show the color tile to use participant. The older "rgb" 0-255 values, or the HDR "p3" or "rec2020" color spaces 
- r/g/b : The r, g, and b values for the displayed color (0-255 for "rgb", and 0-1 for "p3" and "rec2020")
- trialNum : Which page of the experiment being viewed. Color names are asked for on pages 1, 3, and 6.
- tileNum : Which tile on the page this color swatch is (0 - 11). Top-left is 0, and the one to the right of it is tile 1. Up to 4 tiles are shown across, but less on smaller screens.
- rgbSet : full - Full color set (including grays, browns, etc.), line - Saturated Color Set ()
- background : What color of background was behind the color tile
- locale : Language that the study instructions were displayed in
- studyVersion : Study Version


## Color Sampling Procedure

### "line" hue colors
To ensure that each participant is given an approximately perceptually uniform set of colors, we discretize the hue circle into 36 equally-spaced 36 bins (for version 2.x using Oklab color space, and version 1.x using CIELAB color space). Every subject saw one color from each of these 36 bins, with the specific color stimuli randomly sampled from each bin.

### "full" colors
To sample the RGB cube, we select 36 random colors from the full space (for version 2.x using Oklab color space, and version 1.x using CIELAB color space). We added an additional constraint when choosing colors to make sure no two color samples could be too similar for a single user (version 2.x: 0.1 units in Oklab; version 1.x: 20 units in CIELAB space).


## Tile sorting task
Tiles start with a predetermined shuffled state, so every participant starts from the same place (starting from version 1.1 I believe):
```javascript
const colorSetsShuffles = [
		[12,  2, 14, 6,  9,  8,  1,  15, 7,  3,  10, 13, 5,  4,  11],
		[7,  11, 1,  10, 4,  15, 14, 6,  5,  2,  3,  13, 9,  8,  12],
		[3,  14, 7,  12, 1,  5,  2,  8,  15, 11, 10, 4,  13, 9,  6],
		[4,  11, 9,  1,  14, 10, 13, 2,  6,  5,  8,  15, 12, 3,  7],
		[13, 3,  8,  14, 2,  11, 4,  6,  7,  9,  15, 5,  1,  10, 12],
		[8,  9,  4,  5,  2,  13, 3,  7,  12, 11, 14, 6,  1,  15, 10]
	]
```