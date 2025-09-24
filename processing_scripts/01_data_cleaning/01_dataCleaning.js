// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

const fs = require('fs'),
  refine = require('./refine.js'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');

// Path or the input csv file
const FILE_I = "../../raw/color_perception_table_color_names.csv"
const FILE_O = "../../model/cleaned_color_names.csv"; // Path for the output
const FILE_REMOVED_O = "../../model/removed_color_data.csv"; // Path for the output


csv().fromFile(FILE_I)
  .then((colorNames)=>{

  // ignore some of the priming effects and participant info data errors
  // since we already have a lot of data to ge the main issues this
  // would reveal, and hopefully we can get more nuanced or rare colors
  // now by including these

  //colorNames = colorNames.filter(cn => cn.participantId !== 0);
  //colorNames = colorNames.filter(cn => !(cn.lang0=="Korean (한국어, 조선어)" && cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.

  enteredColorNameLookup = {}

  colorNames.forEach(cn => {
    let lab = d3.lab(d3.color(`rgb(${cn.r}, ${cn.g}, ${cn.b})`));
    cn.lab_l = lab.l;
    cn.lab_a = lab.a;
    cn.lab_b = lab.b;

	  enteredColorNameLookup[cn.colorNameId] = cn.name;

  });

  // standardize entered name (e.g., trim, lowcase)
  colorNames.forEach(cn => {
    cn.name = refine.standardize_entered(cn)
    cn.standardized_entered_name = cn.name
  })
  
  var colorNames = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase();
    return cn.name !== "";
  });

  colorNames.forEach(cn => {
    refine.refine(cn)

    // try refining again and make sure it doesn't mess it up
    let oldName = cn.name
    refine.refine(cn)
    let newName = cn.name
    if(oldName != newName){
      console.log("WARNING: Name changed on repeated refining")
      console.log("  lang0", cn.lang0)
      console.log("  colorNameId", cn.colorNameId)
      console.log("  names: ", oldName, ", ", newName)
    }
  })

  colorNames.forEach(cn => {
	  cn.entered_name = enteredColorNameLookup[cn.colorNameId];
  });

  let cleanedData = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase().replace(/[- _]+/g,"");
    return cn.name !== "";
  });

  console.log("writing file");
  let cleanedWriter = csvWriter();
  cleanedWriter.pipe(fs.createWriteStream(FILE_O));

  cleanedData.forEach(d => {
    cleanedWriter.write(d);
  });

  cleanedWriter.end();


  let removedData = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase().replace(/[- _]+/g,"");
    return cn.name == "";
  });
  console.log("writing removed data file");
  let removedWriter = csvWriter();
  removedWriter.pipe(fs.createWriteStream(FILE_REMOVED_O));

  removedData.forEach(d => {
    removedWriter.write(d);
  });

  removedWriter.end();
});

