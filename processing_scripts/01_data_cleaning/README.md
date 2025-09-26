# Step 1: Data Cleaning

These files help in cleaning the naming data, including matching names like "light-green" and "light green," ignoring casing and diacritic marks, removing data entered in the wrong language, spelling mistakes, etc.

## 01_dataCleaning.js
This script runs the data cleaning and produces the cleaned data file. Note that we preserve the original "entered_name", a "standardized_entered_name" that has some general simplification (e.g., trim and lowercase), but keeps variations in spelling, diacritics, etc., and a "name" field used to match all other versions of this name including across misspellings.

Data Outputs:
- model/cleaned_color_names.csv
- model/removed_color_data.csv

Data Inputs:
- raw/color_perception_table_color_names.csv

## refine.js
This file has our data cleaning rules 

There are two higher level rules: 

1) Exclusion Rule
We defined a list of words for each language to exclude terms that are not belong to the corresponding language. If a given word is an item of the list, we excluded the term.

2) Replacement Rule 
We defined a list of pairs of two regular expression to replace/correct a part of a given word. The first  expression is to find the part of the word to be corrected, and the second expression is the correction of the part. 

We also do things like change all traditional Chinese characters to simplified characters, remove diacritic remarks (for matching colors).