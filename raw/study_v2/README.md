
## Study version history:
- 2.0: start of version 2 of the study 
  - ported to nodejs
  - added color match task
  - randomly choose white or black background
  - added support for different color gamuts (before only sRGB, now also P3 and Rec. 2020)
  - randomly choose white or black background
  - update demographics
  - choose colors from Oklab space instead of CIELAB (also randomly shuffle colors after chosen)
  - remove instruction localization (pending updated translations)

- 2.0.1:
  - Fix "next" arrow to have transparent background, so when users get a black background, they don't have any big white areas on screen to compare sample colors to.
- 2.0.2:
  - Fix bugs with saving additional language fields
  - Add option for "other" with textbox when selecting countries
  - In color matching task make sure to save color displayName in addition to the simplified "name"
- 2.1.1:
  - Add Chinese translation of instructions (and ability to switch between Chinese and English instructions at the start)
  - Fix bug in selecting color matching names after changes to full_colors_info.csv in this project 
