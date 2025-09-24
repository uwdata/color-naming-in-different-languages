### Cutomized Data Cleaning Rules

There are two higher level rules: 

1) Exclusion Rule
We defined a list of words for each language to exclude terms that are not belong to the corresponding language. If a given word is an item of the list, we excluded the term.

2) Replacement Rule 
We defined a list of pairs of two regular expression to replace/correct a part of a given word. The first  expression is to find the part of the word to be corrected, and the second expression is the correction of the part. 

Plus, there are some language-specific rules. Each rule set is listed on the below:

### Chinese
- We first change all traditional characters to simplified characters.
- Replacement Rule : 
```
[[/天空蓝/,"天蓝"], [/紫粉/,"粉紫"], [/萤光/,"荧光"], [/红粉/,"粉红"], [/兰/,"蓝"], [/枚红/,"玫红"], [/桔黄/,"橘黄"], [/玫瑰红/,"玫红"], [/紫蓝/,"蓝紫"], [/红紫/,"紫红"], [/绿青/,"青绿"], [/绿黄/,"黄绿"], [/荧光蓝/,"萤光蓝"], [/蓝青/,"青蓝"], [/青色带蓝/,"青蓝"]]
```
### English
- Replacement Rule : 
```
[[/fuschia/, "fuchsia"], [/fuscia/, "fuchsia"], [/fuscia/, "fuchsia"], [/lavender/, "lavender"], [/lavender/, "lavender"], [/turqoise/, "turquoise"], [/grey/, "gray"]]
```
### Korean
- Replacement Rule : 
```
[[/색$/,""],[/[a-zA-Z]/g,""],[/파란/,"파랑"],[/노란/,"노랑"],[/빨간/,"빨강"],[/검은/,"검정"],[/연한/,"연"],[/진한/,"진"],[/청녹/,"청록"]]
```
### Persian
- We first replace the characters that are not native script including dash(-) to whitespace.
- Replace every word (splited by whitespace) having ا as the first character, replace the ا to آ
- Replace every word (splited by whitespace) having ي as the last character, replace the ا to ی

### French
- Exclusion Rule
```
["blue", "green", "purple", "red", "light blue", "yellow", "pink", "electric blue", "king blue", "bright blue", "bright purple", "dark blue", "fluorescent green", "lime", "neon green", "vert flash", "bge", "bleu flashy", "bright green", "electrique", "france", "gold", "green water", "gtz", "jaune primaire", "light green", "marin", "orange red", "printemps", "rose forsythia", "y", "yellow green"]
```
- Replacement Rule
```
[[/fushia/, "fuchsia"], [/fuschia/, "fuchsia"],[/bleu marin/, "bleu marine"],[/fuchsias/, "fuchsia"],[/acide/, "vert acide"],[/aqua marine/, "aquamarine"],[/bleu gommette/, "bleu"],[/bleu prusse/, "bleu de prusse"],[/bue/, "buée"],[/ciel/, "bleu ciel"],[/jaune orange/, "jaune orangé"],[/rose rouge/, "rose, rouge 따로"],[/rouge orange/, "rouge orangé"],[/rouge vermillion/, "vermillon"],[/rouge vermillon/, "vermillon"],[/royal/, "bleu royal"],[/vert claire/, "vert clair"],[/vert jaune/, "jaune vert"],[/viloet/, "violet"],[/aqua/, "aqua frais"],[/bleau cyan/, "bleu cyan"],[/bleu claire/, "bleu clair"],[/bleu électrict/, "bleu électrique"],[/bleu émaraude/, "bleu émeraude"],[/bleu fnoncé/, "bleu foncé"],[/bleu jade/, "jade"],[/bleu pale/, "bleu pâle"],[/bleu plus pale/, "bleu plus pâle"],[/bleur/, "bleu"],[/bleur marine/, "bleu marine"],[/blue ciel/, "bleu ciel"],[/blue normal/, "bleu"],[/canard/, "bleu canard"],[/ecarlate/, "écarlate"],[/fuchia/, "fuchsia"],[/jauen/, "jaune"],[/jaunatre/, "jaunâtre"],[/jaune bouton d'or/, "bouton d'or"],[/jaune brûler/, "jaune brûlé"],[/jaune d'œuf frais/, "jaune d'œuf"],[/jaune d’oeuf/, "jaune d'œuf"],[/jaune oragne/, "jaune orangé"],[/jaune vert fluo/, "jaune fluo"],[/jeaune/, "jaune "],[/mauredoré/, "mordoré"],[/mentholé/, "menthe"],[/orange brûler/, "orange brûlé"],[/orange claire/, "orange clair"],[/orange pale/, "orange pâle"],[/orange sanguin/, "orange sanguine"],[/organge/, "orange"],[/pistaccio/, "pistache"],[/rose fuchia/, "rose fuchsia"],[/rouge orance/, "rouge orangé"],[/turquoi/, "turquoise"],[/turquoisse/, "turquoise"],[/vert mint/, "vert menthe"],[/vert outremer/, "bleu outremer"],[/verte pale/, "vert pâle"],[/very eau/, "vert d'eau"],[/violet pale/, "violet pâle"],[/voilet/, "violet"],[/volet/, "violet"]]
```
### Portuguese
- Exclusion Rule
```
["blue","pink","green","red","orange","yellow","light blue","purple","turquoise","lighter blue","purpel","dark pink","dark yellow","bright green","sea blue","bright pink","light red","gold","yeallow"]
```
- Replacement Rule
```
[[/fucsia/, "fúcsia"], [/lilas/, "lilás"], [/turqueza/, "turquesa"], [/laranja escuto/, "laranja escuro"], [/verde mar/, "verde marinho"], [/azul maringo/, "azul marinho"], [/verdeado/, "esverdeado"], [/rosa chock/, "rosa choque"], [/purpura/, "púrpura"], [/limao/, "limão"]]
```

### Spanish
- Exclusion Rule
```
["blue", "orange", "pink", "green","purple","yellow","red", "light blue", "dark blue", "teal" ]
```
- Replacement Rule:
```
[[/rosado/, "rosa"], [/cian/, "cyan"], [/limon/, "limón"], [/fuxia/, "fucsia"], [/acuamarina/, "aguamarina"], [/purpura/, "púrpura"]]
```

### German
- Exclusion Rule
```
["blue", "cyan", "green", "red", "yellow"]
```
- Replacement Rule:
```
[[/gruen/, "grün"]]
```

### Swedish
- Exclusion Rule
```
["blue", "magenta", "cyan","green", "pink", "purple"]
```

### Russian
- Replacement Rule:
```
[[/жлтый/, "желтый"], [/зелный/, "зеленый"]]
```

### Polish
- Replacement Rule:
```
[["zolty", "żółty"], ["rozowy", "różowy"], [/pomaranczowy/, "pomarańczowy"], [/blekitny/, "błękitny"], [/ciemny/, "ciemno"], [/jasny/, "jasno"]]
```
- Exclusion Ruls
```
["pink"]
```

### Romanian
- Exclusion Rule
```
["blue"]
```
- Replacement Rule:
```
[["roșu", "rosu"], [/închis/, "inchis"]]
```

### Finnish
- Replacement Rule:
```
[["lila", "liila"]]
```

### Dutch
- Exclusion Rule
```
["blue", "fuchsia", "ret", "purple"]
```
