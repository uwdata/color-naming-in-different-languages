// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

const fs = require('fs'),
  refine = require('./refine.js'),
  csv = require("csvtojson"),
  Converter = require("csvtojson").Converter,
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');


const converter = new Converter({ noheader:true});
const RGB_SET = "all";
//const FILE_I = "../data/color_perception_table_color_fullrgb_names.csv"; // Path or the input csv file
const FILE_I = "../color_perception_table_color_names.csv"
const FILE_O = "../cleaned_fullRGB_color_names.csv"; // Path for the output

console.log("test");

fs.createReadStream(FILE_I).pipe(converter);

converter.on("error",function(error){
	console.log(error);
})

converter.on("record_parsed", function (record) {
  console.log(record);
});

//converter.on("end_parsed", function (colorNames) {
csv().fromFile(FILE_I)
  .then((colorNames)=>{
	console.log("test2");
  colorNames = colorNames.filter(cn => cn.participantId !== 0);
  //colorNames = colorNames.filter(cn => cn.rgbSet != "line");
  colorNames = colorNames.filter(cn => !(cn.lang0=="Korean (한국어, 조선어)" && cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.
  
  console.log(colorNames[0]);

  colorNames.forEach(cn => {
    let lab = d3.lab(d3.color(`rgb(${cn.r}, ${cn.g}, ${cn.b})`));
    cn.lab_l = lab.l;
    cn.lab_a = lab.a;
    cn.lab_b = lab.b;
  });
  let cleanedData = refine(colorNames, RGB_SET);
  let writer = csvWriter();
  writer.pipe(fs.createWriteStream(FILE_O));

  cleanedData.forEach(d => {
    writer.write(d);
  });

  writer.end();
});

