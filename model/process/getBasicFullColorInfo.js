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
        numFullNames: term.numFullNames,
        numLineNames: term.numLineNames,
      });
    })

  });

  writer.end();
});

