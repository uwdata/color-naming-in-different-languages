// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

const fs = require('fs'),
  refine = require('./refine.js'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');

const MIN_FULL_COLOR_NAMES = 12;
const LINE_RGB_SET = "line";
const FULL_RGB_SET = "full";


// Path or the input csv file
const FILE_I = "../cleaned_color_names.csv"
const FILE_O = "../basic_full_color_info.csv"; // Path for the output

csv().fromFile(FILE_I)
  .then((colorNames)=>{
  
   let grouped = d3.nest()
    .key(d => d.lang0)
    .entries(colorNames)
    .sort((a,b) =>  - a.values.length + b.values.length);

    grouped.forEach(g => {
      g.terms = d3.nest()
                  .key(v => v.name)
                  .entries(g.values)
                  .sort((a,b) => -a.values.length + b.values.length);

      g.terms.forEach(term => {
        term.numLineNames = term.values.filter(entry => entry.rgbSet == LINE_RGB_SET).length
        term.numFullNames = term.values.filter(entry => entry.rgbSet == FULL_RGB_SET).length
        term.simplifiedName = term.key;
        term.commonName = d3.nest()
          .key(t => t.entered_name)
          .entries(term.values)
          .sort((a,b) => -a.values.length + b.values.length)[0].key;
      })
  
      g.terms = g.terms.filter(g_term => g_term.numFullNames >= MIN_FULL_COLOR_NAMES);

      g.terms.sort((a,b) => -a.numFullNames + b.numFullNames)
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
        commonName: term.commonName,
        simplifiedName: term.simplifiedName,
        numFullNames: term.numFullNames,
        numLineNames: term.numLineNames,
      });
    })
   
  });

  writer.end();
});

