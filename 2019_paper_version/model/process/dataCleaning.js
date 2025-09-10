// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

const fs = require('fs'),
  refine = require('./refine.js'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');


const RGB_SET = "all";
// Path or the input csv file
const FILE_I = "../../raw/color_perception_table_color_names.csv"
const FILE_O = "../cleaned_color_names.csv"; // Path for the output

csv().fromFile(FILE_I)
  .then((colorNames)=>{
  colorNames = colorNames.filter(cn => cn.participantId !== 0);
  //colorNames = colorNames.filter(cn => cn.rgbSet != "line");
  colorNames = colorNames.filter(cn => !(cn.lang0=="Korean (한국어, 조선어)" && cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.

  enteredColorNameLookup = {}

  colorNames.forEach(cn => {
    let lab = d3.lab(d3.color(`rgb(${cn.r}, ${cn.g}, ${cn.b})`));
    cn.lab_l = lab.l;
    cn.lab_a = lab.a;
    cn.lab_b = lab.b;

	enteredColorNameLookup[cn.colorNameId] = cn.name;

  });
  let cleanedData = refine(colorNames, RGB_SET);

  cleanedData.forEach(cn => {
	  cn.entered_name = enteredColorNameLookup[cn.colorNameId];
  });

  console.log("writing file");
  let writer = csvWriter();
  writer.pipe(fs.createWriteStream(FILE_O));

  cleanedData.forEach(d => {
    writer.write(d);
  });

  writer.end();
});

