## Language specific rules

The *_rules.js* files have rules for specific languages based on the two letter language id (see */shared_files/languages-iso-639.js*).

Many of these rules use regular expressions. This [Python tutorial is a pretty good intro](https://www.w3schools.com/python/python_regex.asp)

Each file may provide the following:
- forbiddenCharacters: A regular expression that if any of these characters are found, deletes the name as invalid
- ignoreCharactersForMatching: A regular expression for characters to remove for making a matching name
- keepSpaces: "true" if we shouldn't remove spaces between words (e.g., Arabic, Persian)
- excludeNames: an array of names to exclude from the data (e.g., "test", "asd", wrong language data, etc.)
- nameReplacingRules: A set of rules for changing a name (e.g., fixing typos, like [/indago/, "indigo"]; changing from one script to another, like [/xolte/, "желтый"]) 
- additionalReplacementRule: A function that does additional name replacement operations that can't be done with the rules above
