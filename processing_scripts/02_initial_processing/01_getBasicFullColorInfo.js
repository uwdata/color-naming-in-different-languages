// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

const fs = require('fs'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');

const MIN_FULL_COLOR_NAMES = 12;
const LINE_RGB_SET = "line";
const FULL_RGB_SET = "full";

let colorNamesAbrv = {
	"English": "en",
	'Korean': "ko",
	"Persian": "fa",
	"Chinese": "zh",
	"German": "de",
	"French": "fr",
	"Portuguese": "pt",
	"Spanish": "es",
	"Swedish": "sv",	
  "Russian": "ru",
	"Dutch": "nl",
	"Polish": "pl",
	"Finnish": "fi",
	"Romanian": "ro"
};

const HUE_COLOR_RATIO = JSON.parse(fs.readFileSync("./lab_hue_color_ratio.json")).hueColorRatio;

function getLangAbv(lang){
  const langKey = Object.keys(colorNamesAbrv).find(val => lang.includes(val))
  const abv = colorNamesAbrv[langKey]
  if(!abv){
    console.log("WARNING: abv not found for " + lang)
  }
  return abv
}

// Path or the input csv file
const FILE_I = "../cleaned_color_names.csv"
const FILE_BASIC_COLOR_O = "../basic_full_color_info.csv"; // Path for the output
const FILE_LANG_O = "../lang_info.csv"; // Path for the output

let langDataWriter = csvWriter();
langDataWriter.pipe(fs.createWriteStream(FILE_LANG_O));

csv().fromFile(FILE_I)
  .then((colorNames)=>{

  let grouped_lang = d3.groups(colorNames, d => d.lang0)
    .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) =>  - a.values.length + b.values.length);

  grouped_lang.forEach(lang => {
    lang.terms = d3.groups(lang.values, v => v.name)
                .map(a => {return {key: a[0], values: a[1]}})
                .sort((a,b) => -a.values.length + b.values.length);

    lang.numLineNames = 0
    lang.numFullNames = 0
    lang.numHueColorNames = 0
    lang.numNonHueColorNames = 0

    lang.terms.forEach(term => {
      term.numLineNames = term.values.filter(entry => entry.rgbSet == LINE_RGB_SET).length
      lang.numLineNames += term.numLineNames
      term.numFullNames = term.values.filter(entry => entry.rgbSet == FULL_RGB_SET).length
      lang.numFullNames += term.numFullNames
      term.numHueColorNames = term.values.filter(c => Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0).length
      lang.numHueColorNames += term.numHueColorNames
      term.numNonHueColorNames = term.values.filter(c => !(Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0)).length
      lang.numNonHueColorNames += term.numNonHueColorNames

      term.simplifiedName = term.key;
      term.commonName = d3.groups(term.values,t => t.standardized_entered_name)
        .map(a => {return {key: a[0], values: a[1]}})
        .sort((a,b) => -a.values.length + b.values.length)[0].key;
    })

    lang.terms = lang.terms.filter(g_term => g_term.numFullNames >= MIN_FULL_COLOR_NAMES);

    lang.terms.sort((a,b) => -a.numFullNames + b.numFullNames);
  });

  grouped_lang.sort((a,b) =>  - a.terms.length + b.terms.length);

  console.log("writing file");
  let basicColorWriter = csvWriter();
  basicColorWriter.pipe(fs.createWriteStream(FILE_BASIC_COLOR_O));

  grouped_lang.forEach(lang => {
    const hue_correction_multiplier = (lang.numHueColorNames +  lang.numNonHueColorNames) * HUE_COLOR_RATIO / lang.numHueColorNames
    const non_hue_correction_multiplier = (lang.numHueColorNames +  lang.numNonHueColorNames) * (1-HUE_COLOR_RATIO) / lang.numNonHueColorNames

    lang.hue_correction_multiplier = hue_correction_multiplier
    lang.non_hue_correction_multiplier = non_hue_correction_multiplier

    langDataWriter.write({
      lang: lang.key,
      langAbv: getLangAbv(lang.key),
      numLineNames: lang.numLineNames,
      numFullNames: lang.numFullNames,
      numHueColorNames: lang.numHueColorNames,
      numNonHueColorNames: lang.numNonHueColorNames,
      numFilteredTerms: lang.terms.length,
      hue_correction_multiplier: hue_correction_multiplier,
      non_hue_correction_multiplier: non_hue_correction_multiplier
    })

    lang.terms.forEach(term => {
      const avgLab = getAverageLABColor(term.values, lang)
      const avgRgb = avgLab.rgb()
      //const lab 
      term.avgColorRGBCode = `rgb(${Math.round(avgRgb.r)},${Math.round(avgRgb.g)},${Math.round(avgRgb.b)})`
      term.avgL = avgLab.l
      term.avgA = avgLab.a
      term.avgB = avgLab.b

      delete term.values;
      term.lang = lang.key;
      basicColorWriter.write({
        lang: term.lang,
        lang_abv: getLangAbv(term.lang),
        commonName: term.commonName,
        simplifiedName: term.simplifiedName,
        avgColorRGBCode: term.avgColorRGBCode,
        totalColorFraction: (term.numHueColorNames * hue_correction_multiplier + term.numNonHueColorNames * non_hue_correction_multiplier) 
          / (lang.numHueColorNames * hue_correction_multiplier + lang.numNonHueColorNames * non_hue_correction_multiplier),
        avgL: term.avgL,
        avgA: term.avgA,
        avgB: term.avgB,
        numFullNames: term.numFullNames,
        numLineNames: term.numLineNames,
      });
    })
  });

  basicColorWriter.end();
  langDataWriter.end();
});



function getAverageLABColor(colorEntries, lang){
  const hueNames = colorEntries.filter(c => 
    Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0)
    .map(c => d3.lab(d3.rgb(c.r,c.g,c.b)))
  const nonHueNames = colorEntries.filter(c => 
    ! (Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0))
    .map(c => d3.lab(d3.rgb(c.r,c.g,c.b)))

  const numHueNames = hueNames.length
  const numNonHueNames = nonHueNames.length
  

  const hueSumLab = d3.lab(
    hueNames.map(c => c.l).reduce((a, b) => a + Number(b), 0),
    hueNames.map(c => c.a).reduce((a, b) => a + Number(b), 0),
    hueNames.map(c => c.b).reduce((a, b) => a + Number(b), 0),
  )

  const nonHueSumLab = d3.lab(
    nonHueNames.map(c => c.l).reduce((a, b) => a + Number(b), 0),
    nonHueNames.map(c => c.a).reduce((a, b) => a + Number(b), 0),
    nonHueNames.map(c => c.b).reduce((a, b) => a + Number(b), 0),
  )

  // if only hue or non-hue names are present, then just return that one
  if(numHueNames == 0){
    const nonHueAvgLab = d3.lab(
      nonHueSumLab.l / numNonHueNames,
      nonHueSumLab.a / numNonHueNames,
      nonHueSumLab.b / numNonHueNames)

    return nonHueAvgLab
  } 
  if(numNonHueNames == 0){
    const hueAvgLab = d3.lab(
      hueSumLab.l / numHueNames,
      hueSumLab.a / numHueNames,
      hueSumLab.b / numHueNames)
    return hueAvgLab
  }

  // if both hue and non-hue names are present, find avg by using their
  // sums and totals together
  // while correcting for the expected ratio of hue colors (in a random sample of LAB space)

    // then for average, apply these to counts
  const combinedAvgLab = d3.lab(
    (hueSumLab.l * lang.hue_correction_multiplier  + nonHueSumLab.l * lang.non_hue_correction_multiplier)
      / (numHueNames * lang.hue_correction_multiplier + numNonHueNames * lang.non_hue_correction_multiplier),
    (hueSumLab.a * lang.hue_correction_multiplier  + nonHueSumLab.a * lang.non_hue_correction_multiplier)
      / (numHueNames * lang.hue_correction_multiplier + numNonHueNames * lang.non_hue_correction_multiplier),
    (hueSumLab.b * lang.hue_correction_multiplier  + nonHueSumLab.b * lang.non_hue_correction_multiplier)
      / (numHueNames * lang.hue_correction_multiplier + numNonHueNames * lang.non_hue_correction_multiplier),
  )

  return combinedAvgLab
}

