import fs from "fs";
import csv from 'csvtojson';

import chineseT2STable from './tongwen_table_t2s.js'

// load language color rules
const lang_rules = {}

const lang_rule_files = fs.readdirSync('./lang_rules', {withFileTypes: true})
  .filter(f => !f.isDirectory())
  .map(f => f.name)
  .filter(f => f.endsWith("_rules.js"))

for(const lang_rule_file_name of lang_rule_files){
  const lang = lang_rule_file_name.split("_rules.js")[0]
  lang_rules[lang] = (await import('./lang_rules/'+lang_rule_file_name)).default
}


// load participants to exclude because they entered the wrong language or they entered nonsense
const participants_to_exclude = (await csv().fromFile("participants_to_exclude.csv"))
                                .map(a => a.participantId)

// standardize the entered names (these will be chosen between for display)
//    do things trim ending white space and making all lowercase,
//    and in some languages (e.g., Korean, Chinese) add a standardized ending,
//    so display name will be consistent with those characteristics
function standardize_entered(cn){
  let name = cn.name.replace(/\s*-\s*/, " ")
  name = name.toString().trim().toLowerCase()

  if(lang_rules[cn.lang0Abv]){
    const standardizedEnd = lang_rules[cn.lang0Abv].standardizedEnd
    if(standardizedEnd){
      if(name.length > 0 && !name.endsWith(standardizedEnd)){
          name += standardizedEnd
      }
    }
  }
  return name
}


// For a given color name, clean it up for matching or remove it
function refine(cn){

    // remove participants with ids specifically marked for removal
    if(participants_to_exclude.includes(String(cn.participantId))){
      cn.name = ""
      return
    }

    // general refine:
    // remove diacritics:
    cn.name = cn.name.toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")

    // per language refine
    if (cn.lang0.indexOf("Korean") >= 0) {
      cn.name = cn.name.trim()
        .replace(/색$/,"")
        .replace(/\s*/g,"")
        .replace(/[a-zA-Z]/g,"")
        .replace(/파란/,"파랑")
        .replace(/노란/,"노랑")
        .replace(/빨간/,"빨강")
        .replace(/검은/,"검정")
        .replace(/연한/,"연")
        .replace(/진한/,"진")
        .replace(/청녹/,"청록");

    } else if (cn.lang0.indexOf("English") >= 0) {
      cn.name = cn.name.toString().toLowerCase()
        .replace(/\s*$/,"")
        .replace(/^\s*/,"")
        .replace(/-+/g," ")
        .replace(/[^a-zA-Z]/ig, '')
        .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["en"].nameReplacingRules));

      if (lang_rules["en"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    }else if (cn.lang0.indexOf("Chinese") >= 0) {
      cn.name = cn.name
                  .replace(/色$/,"")
                  .replace(/[a-zA-Z]/g,"")
                  .replace(/\s*/g,"")

      cn.name = convertChinenseT2S(cn.name);
      cn.name = (replaceByArray(cn.name, lang_rules["zh"].nameReplacingRules));

      if (lang_rules["zh"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }

    } else if (cn.lang0.indexOf("Persian") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^\u0600-\u06FF ]/ig, '');

      cn.name = cn.name.split(" ")
        .map(n => 
          n.replace(/\u064A$/,"ی")) // "ي" -> "ی"
        .join(" ");

      cn.name = cn.name.replace(/\u0653/g,"") // "آ" -> "ا"


    } else if(cn.lang0Abv in lang_rules){
      const langRules = lang_rules[cn.lang0Abv]
      cn.name = cn.name
        .toLowerCase() // (did we already do this? duplicate? ) // TODO: start with standardized name
        .replace(/\s*$/,"") // trim white space
        .replace(/^\s*/,"")
        .replace(/-+/g," "); // turn dashes into spaces

      if("nameReplacingRules" in langRules){
        cn.name = replaceByArray(cn.name, langRules.nameReplacingRules)
      }
      if("excludeNames" in langRules && langRules.excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
      if("forbiddenCharacters" in langRules){
        cn.name = cn.name.replace(langRules.forbiddenCharacters,"")
      }
    }

    // re-do some steps in case replacements messed up things
    
    // remove all extra spaces (except in Arabic and Persian)
    if(!cn.lang0.indexOf("Persian") >= 0 && !cn.lang0.indexOf("Arabic") >= 0){
      cn.name = cn.name.replace(/\s*/,"")
    }
    
    // ensure diacritics removed
    cn.name = cn.name.trim().toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
};


function convertChinenseT2S(str){
  return str.split('').map(function(c){ return !!chineseT2STable[c] ? chineseT2STable[c] : c; }).join('');
}
function replaceByArray(string, array){
  array.forEach(function(pattern){
    string = string.replace(pattern[0],pattern[1]);
  });
  return string;
}

export {refine, standardize_entered};