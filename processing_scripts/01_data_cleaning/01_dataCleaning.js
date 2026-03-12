import fs from "fs";
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'
import * as refine from "./refine.js"


import participantLangChanges from "./participant_lang_changes.js"


// Path or the input csv file
const COLOR_NAMES_BY_LANG_D = "../../model/cleaned_color_data_by_lang/"

const COLOR_NAMES_I = "../../raw/color_names.csv"
const DEMOGRAPHICS_I = "../../raw/demographics.csv"
const COLOR_NAMES_O = "../../model/cleaned_color_names.csv";
const COLOR_NAMES_BY_LANG_O = COLOR_NAMES_BY_LANG_D + "cleaned_color_names";
const COLOR_NAMES_REMOVED_O = "../../model/removed_color_data.csv";
const COLOR_NAMES_REMOVED_BY_LANG_O = COLOR_NAMES_BY_LANG_D + "removed_color_data";


const COLOR_MATCHES_I = "../../raw/color_name_matches.csv"
const COLOR_MATCHES_O = "../../model/cleaned_color_name_matches.csv";
const COLOR_MATCHES_BY_LANG_O = COLOR_NAMES_BY_LANG_D + "cleaned_color_name_matches";

// load language names to fix
const lang_name_changes = await csv().fromFile("lang_name_change.csv")


const csvColumnOrder = [
  "participantId",
  "langAbv",
  "lang",
  "name",
  "standardized_entered_name",
  "entered_name",
  "colorSpace", "r", "g", "b",
  "trialNum", "tileNum",
  "rgbSet",
  "background",
  "instructionsLocale",
  "browserLocale",
  "studyVersion",
  "originalLangAbv"
]

const csvDeletedColumnOrder = [
  "reason_excluded",
  "participantId",
  "langAbv",
  "lang",
  "standardized_entered_name",
  "entered_name",
  "colorSpace", "r", "g", "b",
  "trialNum", "tileNum",
  "rgbSet",
  "background",
  "instructionsLocale",
  "browserLocale",
  "studyVersion",
  "originalLangAbv"
]

const colorMatchColumnOrder = [
  "participantId",
  "langAbv",
  "lang",
  "trialNum",
  "termNum",
  "colorNum",
  "name",
  "displayName",
  "match",
  "colorSpace",
  "r",
  "g",
  "b",
  "rgbSet",
  "studyVersion",
  "instructionsLocale",
  "browserLocale",
  "background"
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


const demographics_info = await csv().fromFile(DEMOGRAPHICS_I)

// clear old files:
for(const file of fs.readdirSync(COLOR_NAMES_BY_LANG_D)){
  //console.log("delete file? " + file)
  fs.rmSync(COLOR_NAMES_BY_LANG_D + file)
}


let colorNames = await csv().fromFile(COLOR_NAMES_I)

// we previously left out some data because we were worried about
// priming effects and missing demographics, but since we now have
// lot of data, we think it worth including all the data
// and hopefully we can get more nuanced or rare colors
//
//colorNames = colorNames.filter(cn => cn.participantId !== 0);
//colorNames = colorNames.filter(cn => !(cn.lang=="Korean (한국어, 조선어)" && cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.

const enteredColorNameLookup = {}

for(const [cn_i, cn] of colorNames.entries()){
  cn.cn_i = cn_i
  enteredColorNameLookup[cn.cn_i] = cn.name;
}

// Fix language names then
// Add language abbreviation to each color name
for(const colorName of colorNames){
  if(lang_name_changes.map(lnc => lnc.lang).includes(colorName.lang)){
    colorName.originalLangAbv = colorName.lang
    colorName.lang = lang_name_changes.find(lnc => lnc.lang == colorName.lang).newLang
  }
  colorName.langAbv = getLangAbv(colorName.lang)
}

// change languages for specific participants
for(const [cn_i, cn] of colorNames.entries()){
  if(cn.participantId in participantLangChanges){
    if(!(cn.originalLangAbv in cn)){
      cn.originalLangAbv = cn.langAbv
    }
    const newLangAbv = participantLangChanges[cn.participantId]
    if((typeof newLangAbv) === "string"){
      cn.langAbv = newLangAbv
    } else if(cn.langAbv !== undefined){
      if(cn.langAbv in newLangAbv){
        cn.langAbv = newLangAbv[cn.originalLangAbv]
      } else {
        // don't change in this case, go back to how it was
        delete cn.originalLangAbv
        continue
      }
    } else {
      if(cn.lang in newLangAbv){
        cn.langAbv = newLangAbv[cn.lang]
      } else { 
        // don't change in this case, go back to how it was
        delete cn.originalLangAbv
        continue
      }
    }
    const lang = languages_iso_639.find(l => l["639‑1"] == cn.langAbv)
    cn.lang = `${lang["Language name"]} (${lang["Native name"]})`
  }
}

//////////////////
//optional modify languages to create additional splits through the rest of the process
// e.g., gender split
// for(const [cn_i, cn] of colorNames.entries()){
//   const demographic = demographics_info.find(d => d.participantId == cn.participantId)
//   if(demographic && cn.participantId != 0){
//     cn.lang = cn.lang + " - " + demographic.gender
//     cn.langAbv = cn.langAbv + " - " + demographic.gender
//   } else {
//     cn.lang = ""
//     cn.langAbv = ""
//   }
// }
// colorNames = colorNames.filter(cn => cn.lang)


//optional modify languages to separate by region
//
// for(const [cn_i, cn] of colorNames.entries()){
//   const demographic = demographics_info.find(d => d.participantId == cn.participantId)
//   if(demographic && cn.participantId != 0){
//     if(demographic.ipRegion){
//       cn.lang = cn.lang + " - " + demographic.ipRegion
//       cn.langAbv = cn.langAbv + " - " + demographic.ipRegion
//     }
//   }
// }
// colorNames = colorNames.filter(cn => cn.lang)
//////////////////


// standardize entered name (e.g., trim, lowcase)
colorNames.forEach(cn => {
  cn.name = refine.standardize_entered(cn)
  cn.standardized_entered_name = cn.name
})

// Remove all blank color names (don't even bother to report these as "deleted")
colorNames = colorNames.filter(cn => {
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
      console.log("  lang", cn.lang)
      console.log("  entered name", enteredColorNameLookup[cn.cn_i])
      console.log("  colorName row", cn.cn_i)
      console.log("  names: ", oldName, ", ", newName)
    }
  }
})

colorNames.forEach(cn => {
  cn.entered_name = enteredColorNameLookup[cn.cn_i];
});

let cleanedData = colorNames.filter(cn => {
  return cn.name !== "";
});

console.log("writing file");
let cleanedWriter = csvWriter({headers: csvColumnOrder});
cleanedWriter.pipe(fs.createWriteStream(COLOR_NAMES_O));

const cleanedWritersByLang = {}

cleanedData.forEach(d => {
  delete d.cn_i
  cleanedWriter.write(d);

  const langAbv = d.langAbv ? d.langAbv : d.lang 

  if(!(langAbv in cleanedWritersByLang)){
    const cleanedWriterByLangTmp = csvWriter({headers: csvColumnOrder});
    cleanedWriterByLangTmp.pipe(fs.createWriteStream(COLOR_NAMES_BY_LANG_O + "-"+langAbv+".csv"));
    cleanedWritersByLang[langAbv] = cleanedWriterByLangTmp
  }
  cleanedWritersByLang[langAbv].write(d)
});

cleanedWriter.end();


let removedData = colorNames.filter(cn => {
  return cn.name === "";
});
if(removedData.length > 0){
  console.log("writing removed data file");
  let removedWriter = csvWriter({headers: csvDeletedColumnOrder});
  removedWriter.pipe(fs.createWriteStream(COLOR_NAMES_REMOVED_O));
  const removedWriterByLang = {}

  removedData.forEach(d => {
    delete d.cn_i
    removedWriter.write(d);

    const langAbv = d.langAbv ? d.langAbv : d.lang 

    if(!(langAbv in removedWriterByLang)){
      const removedWriterByLangTmp = csvWriter({headers: csvColumnOrder});
      removedWriterByLangTmp.pipe(fs.createWriteStream(COLOR_NAMES_REMOVED_BY_LANG_O + "-"+langAbv+".csv"));
      removedWriterByLang[langAbv] = removedWriterByLangTmp
    }
    removedWriterByLang[langAbv].write(d)
  });

  removedWriter.end();
}



///////////////////////
// Color name Matches
let color_name_matches = await csv().fromFile(COLOR_MATCHES_I)


color_name_matches.forEach(cn => {

  cn.langAbv = getLangAbv(cn.lang)
  
  let oldName = cn.name
  refine.refine(cn)
  let newName = cn.name
  if(oldName != newName){
      console.log("WARNING: Name changed when transferring color name match")
      console.log("  lang", cn.lang)
      console.log("  entered name", enteredColorNameLookup[cn.cn_i])
      console.log("  colorName row", cn.cn_i)
      console.log("  names: ", oldName, ", ", newName)
  }

  if(cn.name != ""){
    // try refining again and make sure it doesn't mess it up
    //   e.g., simply replacing "blu" with "blue" would turn "blue" into "bluee"
    let oldName = cn.name
    refine.refine(cn)
    let newName = cn.name
    if(oldName != newName){
      console.log("WARNING: Name changed on repeated refining (color name matches)")
      console.log("  lang", cn.lang)
      console.log("  entered name", enteredColorNameLookup[cn.cn_i])
      console.log("  colorName row", cn.cn_i)
      console.log("  names: ", oldName, ", ", newName)
    }
  }
})

//////////////////
  //optional modify languages to create additional splits through the rest of the process
  // e.g., gender split
  // for(const [cn_i, cn] of color_name_matches.entries()){
  //   const demographic = demographics_info.find(d => d.participantId == cn.participantId)
  //   if(demographic && cn.participantId != 0){
  //     cn.lang = cn.lang + " - " + demographic.gender
  //     cn.langAbv = cn.langAbv + " - " + demographic.gender
  //   } else {
  //     cn.lang = ""
  //     cn.langAbv = ""
  //   }
  // }
  // color_name_matches = colorNames.filter(cn => cn.lang)


  //optional modify languages to separate by region
  //
  // for(const [cn_i, cn] of color_name_matches.entries()){
  //   const demographic = demographics_info.find(d => d.participantId == cn.participantId)
  //   if(demographic && cn.participantId != 0){
  //     if(demographic.ipRegion){
  //       cn.lang = cn.lang + " - " + demographic.ipRegion
  //       cn.langAbv = cn.langAbv + " - " + demographic.ipRegion
  //     }
  //   }
  // }
  // color_name_matches = color_name_matches.filter(cn => cn.lang)
  //////////////////

// color_name_matches.forEach(cn => {
//   cn.entered_name = enteredColorNameLookup[cn.cn_i];
// });

// let cleanedData = colorNames.filter(cn => {
//   return cn.name !== "";
// });

console.log("writing file");
let cleanedMatchesWriter = csvWriter({headers: colorMatchColumnOrder});
cleanedMatchesWriter.pipe(fs.createWriteStream(COLOR_MATCHES_O));
const cleanedMatchesWriterByLang = {}

color_name_matches.forEach(d => {
  delete d.cn_i
  cleanedMatchesWriter.write(d);

    const langAbv = d.langAbv ? d.langAbv : d.lang 

    if(!(langAbv in cleanedMatchesWriterByLang)){
      const cleanedMatchesByLangTmp = csvWriter({headers: colorMatchColumnOrder});
      cleanedMatchesByLangTmp.pipe(fs.createWriteStream(COLOR_MATCHES_BY_LANG_O + "-"+langAbv+".csv"));
      cleanedMatchesWriterByLang[langAbv] = cleanedMatchesByLangTmp
    }
    cleanedMatchesWriterByLang[langAbv].write(d)
});