# Step 1: Data Cleaning

These files help in cleaning the naming data, including matching names like "light-green" and "light green," ignoring casing and diacritic marks, removing data entered in the wrong language, spelling mistakes, etc.

## 01_dataCleaning.js
This script runs the data cleaning and produces the cleaned data file. Note that we preserve the original "entered_name", a "standardized_entered_name" that has some general simplification (e.g., trim and lowercase), but keeps variations in spelling, diacritics, etc., and a "name" field used to match all other versions of this name including across misspellings.

Data Outputs:
- model/cleaned_color_names.csv
- model/removed_color_data.csv

Data Inputs:
- raw/color_names.csv
- Refinement Rules (see below)

## Refinement Rules and refine.js
There are a number of files with refinement rules. Most are run by *rifine.js*. But also:

- *lang_name_change.csv* has rules for changing language names
- *participant_lang_changes.js* has rules for changing languages for specific participants, and specific pages of results for participants (some will answer one page in the target language and another page in English)
- *participants_to_exclude.csv* has specific ids for participants to exclude (e.g., they entered nonsense or entered data in the wrong language)
- *lang_rules/*_rules.js* has rules for specific languages based on the two letter language id (see */shared_files/languages-iso-639.js*). Look in that folder for more on language rules

The full process of refining color names in 01_dataCleaning.js goes as follows:

1. Change color name **lang** if there is a rule to do so in *lang_name_change.csv*
2. Add the two letter "639‑1" abbreviation for the language
3. Change language for participants listed in *participant_lang_changes.js*
4. find the **standardized_entered_name** color name (e.g., trim whitespace, all lowercase, replace dash with space, etc.)- from *refine.js*
5. remove all blank color names (don't bother to save this in *removed_color_data.csv*)
6. find the matching color name using *refine.js*
   1. Remove data based on **participantId** based on *participants_to_exclude.csv*
   2. make name lowercase, and try to remove all diacritics, short vowel marks, etc.
   3. Remove extra spaces, replace dashes with spaces
   4. if the language has a convertScript function, use it to convert the script (e.g., traditional -> simplified Chinese)
   5. if the language has a standardizedEnd (e.g., "色" in Chinese), remove it
   6. if the language has any nameReplacingRules (e.g., "pruple" -> "purple"), run them on the color name
   7. if the language has any excludeNames (e.g., "test" or "asdf"), remove them
   8. if the language has any forbiddenCharacters, remove the name if it has a forbidden character
   9. if the language has any ignoreCharactersForMatching, remove those characters from the name
   10. if the language has nameReplacingRules, run that again (in case changes above make it now match a rule)
   11. if the language has an additionalReplacementRule, run that on the name
   12. Do one more pass of removing whitespace, making lowercase, removing diacritics, etc.
7. re-run the refine function from **refine.js** to make sure the name doesn't change again, since that would mean our refining process is not stable (e.g., replacing "gree" with "green" could cause "green" -> "greenn" -> "greennn", etc.)
