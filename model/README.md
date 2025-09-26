# Model


This folder contains the calculations and models we made about colors and color names.

## Color Calculations (without color names)
The "color_info_pre_naming" has data color spaces and color bins that will be used in later steps once we have color names.

Created by:
- The scripts in: 00_pre-processing-colors

## Cleaned Color Names
"cleaned_color_names.csv" contains the cleaned version of the raw dataset. Besides removing data, we:
- update the "name" field to include a simplified matching name (e.g., fixing typos, removing diacritic marks)
- the "entered_name" field is the name as it was entered
- the "standardized_entered_name" has some standardization steps run on it (e.g., all lowercase, trimmed white space)

Created by: 
- processing_scripts/01_data_cleaning/01_dataCleaning.js

## Removed Color Data
"removed_color_data.csv" is the raw data that was excluded in our data cleaning process

Created by: 
- processing_scripts/01_data_cleaning/01_dataCleaning.js

## Language Info

TODO

## Full Colors Info


TODO

## Binned Hue Colors

TODO

## Binned Full Colors

TODO:

Each color naming model is a JSON array of color-name pairs. Each pair has the below properties:

- lang : Language
- binNum/binL/binA/binB : Index of Color Bin
- term : Color name
- cnt : Count
- pCT : Probability of a color (c) given a term (t) (P(c|t))
- pTC : Probability of a term (t) given a color (c) (P(t|c))
- schema : (for scheme_color_model only) Schema

## Translation loss

TODO

`translation_loss` is also an array having the translation losses between the top 100 English and Korean color name for full colors. 'dist' property indicate the distance (loss) between the English term (enTerm) and the Korean term (koTerm).


## Scheme Color Data

TODO

Note: We represent the color labels provided by the participants in our study, which includes whatever racial biases they have (e.g., the color "skin"). This is not meant to be a prescriptive definition of what colors  fit what labels.
