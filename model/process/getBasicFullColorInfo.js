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
const FILE_O = "../basic_full_color_info.csv"; // Path for the output

csv().fromFile(FILE_I)
  .then((colorNames)=>{

   let grouped = d3.groups(colorNames, d => d.lang0)
    .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) =>  - a.values.length + b.values.length);

    grouped.forEach(g => {
      g.terms = d3.groups(g.values, v => v.name)
                  .map(a => {return {key: a[0], values: a[1]}})
                  .sort((a,b) => -a.values.length + b.values.length);

      g.terms.forEach(term => {
        term.numLineNames = term.values.filter(entry => entry.rgbSet == LINE_RGB_SET).length
        term.numFullNames = term.values.filter(entry => entry.rgbSet == FULL_RGB_SET).length
        term.simplifiedName = term.key;
        term.commonName = d3.groups(term.values,t => t.standardized_entered_name)
          .map(a => {return {key: a[0], values: a[1]}})
          .sort((a,b) => -a.values.length + b.values.length)[0].key;
        const avgLab = getAverageLABColor(term.values)
        const avgRgb = avgLab.rgb()
        //const lab 
        term.avgColorRGBCode = `rgb(${Math.round(avgRgb.r)},${Math.round(avgRgb.g)},${Math.round(avgRgb.b)})`
        term.avgL = avgLab.l
        term.avgA = avgLab.a
        term.avgB = avgLab.b
      })

      g.terms = g.terms.filter(g_term => g_term.numFullNames >= MIN_FULL_COLOR_NAMES);

      g.terms.sort((a,b) => -a.numFullNames + b.numFullNames);
    });

    grouped.sort((a,b) =>  - a.terms.length + b.terms.length);

  console.log("writing file");
  let writer = csvWriter();
  writer.pipe(fs.createWriteStream(FILE_O));

  grouped.forEach(lang => {
    lang.terms.forEach(term => {
      delete term.values;
      term.lang = lang.key;
      writer.write({
        lang: term.lang,
        lang_abv: getLangAbv(term.lang),
        commonName: term.commonName,
        simplifiedName: term.simplifiedName,
        avgColorRGBCode: term.avgColorRGBCode,
        avgL: term.avgL,
        avgA: term.avgA,
        avgB: term.avgB,
        numFullNames: term.numFullNames,
        numLineNames: term.numLineNames,
      });
    })

  });

  writer.end();
});

function getAverageLABColor(colorEntries){
  const hueNames = colorEntries.filter(c => 
    Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0)
    .map(c => d3.lab(d3.rgb(c.r,c.g,c.b)))
  const nonHueNames = colorEntries.filter(c => 
    ! (Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0))
    .map(c => d3.lab(d3.rgb(c.r,c.g,c.b)))

  const numHueNames = hueNames.length
  const numNonHueNames = nonHueNames.length
  

  const hueAvgLab = d3.lab(
    hueNames.map(c => c.l).reduce((a, b) => a + Number(b), 0) / numHueNames,
    hueNames.map(c => c.a).reduce((a, b) => a + Number(b), 0) / numHueNames,
    hueNames.map(c => c.b).reduce((a, b) => a + Number(b), 0) / numHueNames,
  )

  const nonHueAvgLab = d3.lab(
    nonHueNames.map(c => c.l).reduce((a, b) => a + Number(b), 0) / numNonHueNames,
    nonHueNames.map(c => c.a).reduce((a, b) => a + Number(b), 0) / numNonHueNames,
    nonHueNames.map(c => c.b).reduce((a, b) => a + Number(b), 0) / numNonHueNames,
  )

  // if only hue or non-hue names are present, then just return that one
  if(numHueNames == 0){
    return nonHueAvgLab
  } 
  if(numNonHueNames == 0){
    return hueAvgLab
  }

  // if both hue and non-hue names are present, combine their averages together
  // while correcting for the expected ratio of hue colors (in a random sample of LAB space)
  const combinedAvgLab = d3.lab(
    hueAvgLab.l * HUE_COLOR_RATIO + nonHueAvgLab.l * (1-HUE_COLOR_RATIO),
    hueAvgLab.a * HUE_COLOR_RATIO + nonHueAvgLab.a * (1-HUE_COLOR_RATIO),
    hueAvgLab.b * HUE_COLOR_RATIO + nonHueAvgLab.b * (1-HUE_COLOR_RATIO),
  )

  return combinedAvgLab
}

