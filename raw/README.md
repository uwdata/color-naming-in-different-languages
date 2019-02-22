## Column Info
### color_perception_table_color_names.csv
- colorNameId : Index of each record
- participantId : Participant ID that can be used to join _color_perception_table_demographics.csv_
- lang0 : Language of a color name
- phaseNum : ?
- trialNum : ?
- tileNum : ?
- name : Color name
- r/g/b : RGB code of the displayed color
- studyVersion : Study Version
- rgbSet : full - Full Color Set, line - Hue Color Set
- lab_l/lab_a/lab_b : CIELAB code of the displayed color
- locale : ? (Language that the website used?)


### color_perception_table_demographics.csv
- participantId : Participant ID that can be used to join _color_perception_table_color_names.csv_
- current_time : Participated time
- retake : (Have you taken this test before?) 0 - No, 1 - Yes
- gender : 0 - Male, 1 - Female, 2 - Other
- multinational : (Have you lived in more than one country?) 0 - No, 1 - Yes
- education : The highest level of education the participant has received/is pursuing
- country[0-5] : (Which was the first/second/... country where you lived?)
- lang0 : Language the participant prefers to name colors in
- lang1/lang2 : The other languages that are listed as the participant knows
- fluency1/fluency2 : The fluencies of lang1 and lang2 (0 - ?, 1 - ?, 2 - ??, 3 - ??)
- age : Age
- colorBlindness : Self-reported color blindness (none, red-green, other )
- colorBlindnessText0 : Details of the participant's color blindness
- surrBrightness :
- surrBrightIDK :
- mBrightness :
- mBrightIDK :
- colorWork : (Do your work or studies require you to have a knowledge of different colors and their names that might be considered above average? (e.g. graphic designer, painter, make-up artist)?) 0 - No, 1 - Yes, (blank) - NA
- colorWorkText0 : Description for the color work. (Please tell us what those work or studies are)
- langAOtherText0 :
- langBOtherText0 :
- langCOtherText0 :
- surrBrightnessSlider :
- mBrightnessSlider :
- mbidk :
- sbidk :
- ageInput : ?


-- The below columns are not collected --
- normalvision, urban, web_usage, profession, years0, years1, years2, years3, years4, years5, father, mother, 

## History of Technical Issues

- Null Pariticipants ID in demographics.csv
- Participant ID = 0
- Ill-recorded Color Blindness data
- Version 1.1.4 : Possible Priming effect due to the advertisement showing Korean and English color names for some hue colors.


