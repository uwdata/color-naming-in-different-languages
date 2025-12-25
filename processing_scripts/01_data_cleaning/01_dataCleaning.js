// Need to install 'csvtojson' and 'csv-write-stream'
// npm install csvtojson
// npm install csv-write-stream

import fs from "fs";
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'
import * as refine from "./refine.js"


import participantLangChanges from "./participant_lang_changes.js"


// Path or the input csv file
const FILE_I = "../../raw/color_names.csv"
const FILE_O = "../../model/cleaned_color_names.csv"; // Path for the output
const FILE_REMOVED_O = "../../model/removed_color_data.csv"; // Path for the output

const csvColumnOrder = [
  "participantId",
  "lang0Abv",
  "lang0",
  "name",
  "standardized_entered_name",
  "entered_name",
  "colorSpace", "r", "g", "b",
  "trialNum", "tileNum",
  "rgbSet",
  "background",
  "locale",
  "studyVersion",
  "originalLang0Abv"
]

const csvDeletedColumnOrder = [
  "reason_excluded",
  "participantId",
  "lang0Abv",
  "lang0",
  "standardized_entered_name",
  "entered_name",
  "colorSpace", "r", "g", "b",
  "trialNum", "tileNum",
  "rgbSet",
  "background",
  "locale",
  "studyVersion",
  "originalLang0Abv"
]

import {languages_iso_639} from "../../shared_files/languages-iso-639.js"
const missingLangs = []
function getLangAbv(lang){
  const lang_data = languages_iso_639.find(l => `${l["Language name"]} (${l["Native name"]})` == lang)
  let abv
  if(lang_data){
    abv = lang_data["639‑1"]
  } else{
    if(!(missingLangs.includes(lang))){
      console.log("WARNING: abv not found for " + lang)
      missingLangs.push(lang)
    }
  }
  return abv
}


csv().fromFile(FILE_I)
  .then((colorNames)=>{

  // ignore some of the priming effects and participant info data errors
  // since we already have a lot of data to ge the main issues this
  // would reveal, and hopefully we can get more nuanced or rare colors
  // now by including these

  //colorNames = colorNames.filter(cn => cn.participantId !== 0);
  //colorNames = colorNames.filter(cn => !(cn.lang0=="Korean (한국어, 조선어)" && cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.

  const enteredColorNameLookup = {}

  for(const [cn_i, cn] of colorNames.entries()){
    cn.cn_i = cn_i
    enteredColorNameLookup[cn.cn_i] = cn.name;
  }

  // Add language abbreviation to each color name
  for(const colorName of colorNames){
    colorName.lang0Abv = getLangAbv(colorName.lang0)
  }

  for(const [cn_i, cn] of colorNames.entries()){
    if(cn.participantId in participantLangChanges){
      cn.originalLang0Abv = cn.lang0Abv
      cn.lang0Abv = participantLangChanges[cn.participantId]
      const lang = languages_iso_639.find(l => l["639‑1"] == cn.lang0Abv)
      cn.lang0 = `${lang["Language name"]} (${lang["Native name"]})`
    }
  }

  // standardize entered name (e.g., trim, lowcase)
  colorNames.forEach(cn => {
    cn.name = refine.standardize_entered(cn)
    cn.standardized_entered_name = cn.name
  })
  
  // Remove all blank color names (don't even bother to report these as "deleted")
  var colorNames = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase();
    return cn.name !== "";
  });
  
  colorNames.forEach(cn => {
    refine.refine(cn)

    if(cn.name != ""){
      // try refining again and make sure it doesn't mess it up
      //   e.g., simply replacing "blu" with "blue" would turn "blue" into "bluee"
      let oldName = cn.name
      refine.refine(cn)
      let newName = cn.name
      if(oldName != newName){
        console.log("WARNING: Name changed on repeated refining")
        console.log("  lang0", cn.lang0)
        console.log("  colorName row", cn.cn_i)
        console.log("  names: ", oldName, ", ", newName)
      }
    }
  })

  colorNames.forEach(cn => {
	  cn.entered_name = enteredColorNameLookup[cn.cn_i];
  });

  let cleanedData = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase().replace(/[- _]+/g,"");
    return cn.name !== "";
  });

  console.log("writing file");
  let cleanedWriter = csvWriter({headers: csvColumnOrder});
  cleanedWriter.pipe(fs.createWriteStream(FILE_O));

  cleanedData.forEach(d => {
    delete d.cn_i
    cleanedWriter.write(d);
  });

  cleanedWriter.end();


  let removedData = colorNames.filter(cn => {
    cn.name = cn.name.toString().trim().toLowerCase().replace(/[- _]+/g,"");
    return cn.name == "";
  });
  console.log("writing removed data file");
  let removedWriter = csvWriter({headers: csvDeletedColumnOrder});
  removedWriter.pipe(fs.createWriteStream(FILE_REMOVED_O));

  removedData.forEach(d => {
    delete d.cn_i
    removedWriter.write(d);
  });

  removedWriter.end();
});

