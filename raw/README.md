## Column Info
### color_perception_table_color_names.csv
- colorNameId : Index of each record
- participantId : Participant ID that can be used to join _color_perception_table_demographics.csv_
- lang0 : Language of a color name
- trialNum : Which page of the experiment being viewed. Color names are asked for on pagees 1, 3, and 6.
- tileNum : Which tile on the page this color swatch is (0 - 11). Top-left is 0, and the one to the right of it is tile 1. Up to 4 tiles are shown across, but less on smaller screens.
- name : Color name entered by participant
- r/g/b : RGB code of the displayed color
- studyVersion : Study Version
- rgbSet : full - Full Color Set, line - Saturated Color Set
- locale : Language that the study instructions were displayed in



### color_perception_table_demographics.csv
- participantId : Participant ID that can be used to join _color_perception_table_color_names.csv_
- current_time : Participated time
- retake : (Have you taken this test before?) 0 - No, 1 - Yes
- gender : 0 - Male, 1 - Female, 2 - Other
- multinational : (Have you lived in more than one country?) 0 - No, 1 - Yes
- education : The highest level of education the participant has received/is pursuing
- country[0-5] : (Which was the first/second/... country where you lived?)
- lang0 : answer to "What is your native language? If more than one native language, choose the language you would prefer to name colors in."
- lang1/lang2 : Other languages participants listed knowing
- fluency1/fluency2 : The fluencies of lang1 and lang2 (0 - ?, 1 - ?, 2 - ??, 3 - ??) Appears to be broken.
- age : Age
- colorBlindness : Self-reported color blindness (none, red-green, other )
- colorBlindnessText0 : Details of the participant's color blindness if they selected "other"
- colorWork : Answer to "Do your work or studies require you to have a knowledge of different colors and their names that might be considered above average? (e.g. graphic designer, painter, make-up artist)?" 0 - No, 1 - Yes, (blank) - NA
- colorWorkText0 : Answer to "Please tell us what those work or studies are (in a word or a short sentance)?" for those who sed yes to colorWork.
- surrBrightnessSlider : Answer to "How bright is your surrounding? (Ignoring the light from your computer screen)" ranging from 0 (Midnight pitch black) to 100 (Noon summer sun)
- mBrightnessSlider : Answer to "What is your monitor brightness?" ranging from 0 (Midnight pitch black) to 100 (Noon summer sun) mBrightness
- surrBrightIDK : "I don't know" checkbox next to surrBrightness input.
- mBrightIDK : "I don't know" checkbox next to mBrightness input.

-- Duplicate / helper fields --
- mBrightness : Should be the same as mBrightnessSlider, but mBrightnessSlider is most accurate.
- surrBrightness : Should be the same as surrBrightnessSlider, but surrBrightnessSlider is most accurate.
- langAOtherText0 : data from a custom entry box for people who selected "other" in the lang0 dropdown
- langBOtherText0 : data from a custom entry box for people who selected "other" in the lang1 dropdown
- langCOtherText0 : data from a custom entry box for people who selected "other" in the lang2 dropdown
- mbidk : Data from a helper html element, should be the same as mBrightIDK, but isn't. Not sure which is more accurate.
- sbidk : Data from a helper html element, should be the same as surrBrightIDK, but isn't. Not sure which is more accurate.
- ageInput : Data from a helper age input box (to help translate alternate numeral systems into Arabic numerls, e.g., "۱۳" -> "13")


## History of Maintenance Issues

- Missing Demographics : Due to a technical issue, we could not collect some of participants demographic information. (Most of the participants were Farsi.) Now, it works properly.
- Duplicate Participant ID (often 0): Due to a technical bug, sometimes duplicate Participant IDs are selected, and sometimes the system fails to generate a participant ID, resulting in a participant ID of 0.
- Missing Color Blindness data : For much of the study, a data type bug caused all colorBlindness entries to save as 0. Any values that are not 0 should be valid
- Version 1.1.4 : Possible Priming effect due to the advertisement showing Korean and English color names for some saturated colors.

## Color Sampling Procedure

To ensure that each participant is given an approximately perceptually uniform set of colors, we discretize the hue circle into 36 equally-spaced 36 bins within CIELAB color space. Every subject saw one color from each of these 36 bins, with the specific color stimuli randomly sampled from each bin.

To sample the RGB cube, we select 36 random colors from the full space, subject to the constraint that all samples must be at least 20 units apart in CIELAB space to ensure that reasonably different colors are presented. Also, To cover the perceptual space more evenly, we increased the likelihood of selecting colors with larger CIELAB sizes (though this redistribution step failed for some of our data due to a programming error).