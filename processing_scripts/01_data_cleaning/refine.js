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


// exclude some participants because they entered the wrong language or they entered nonsense
const participants_to_exclude = (await csv().fromFile("participants_to_exclude.csv"))
                                .map(a => a.participantId)

function standardize_entered(cn){
  let name = cn.name.replace(/\s*-\s*/, " ")
  name = name.toString().trim().toLowerCase()

  if (cn.lang0.indexOf("Korean") >= 0) {
      name = name.trim()
      if(name.length > 0 && !name.endsWith("색")){
        name += "색"
      }
  } else if (name.length > 0 && cn.lang0.indexOf("Chinese") >= 0) {
    name = name.trim()
    if(!name.endsWith("色")){
      name += "色"
    }
  }

  return name
}

function refine(cn){

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

    } else if (cn.lang0.indexOf("Spanish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      
      cn.name = (replaceByArray(cn.name, lang_rules["es"].nameReplacingRules));
      if (lang_rules["es"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Deutsch") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["de"].nameReplacingRules));
      if (lang_rules["de"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("French") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["fr"].nameReplacingRules));
      if (lang_rules["fr"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }

    } else if (cn.lang0.indexOf("Italian") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["it"].nameReplacingRules));
      if (lang_rules["it"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Swedish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      if (lang_rules["sv"].excludeNames.indexOf(cn.name) >= 0 ) {
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
    } else if (cn.lang0.indexOf("Portuguese") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["pt"].nameReplacingRules));
      if(lang_rules["pt"].excludeNames.indexOf(cn.name) >= 0){
        cn.name = ""
      }
    } else if (cn.lang0.indexOf("Polish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["pl"].nameReplacingRules));
      if (lang_rules["pl"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Danish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["da"].nameReplacingRules));
      if (lang_rules["da"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Dutch") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      if (lang_rules["nl"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Romanian") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["ro"].nameReplacingRules));

      if (lang_rules["ro"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Russian") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ")
            .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["ru"].nameReplacingRules));
      cn.name = cn.name.replace(/[^а-яА-Я]/ig, '')
    } else if (cn.lang0.indexOf("Arabic") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^\u0600-\u06FF]/ig, '')
            .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, lang_rules["ar"].nameReplacingRules));
    } else if (cn.lang0.indexOf("Persian") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^\u0600-\u06FF ]/ig, '');

      cn.name = cn.name.split(" ")
        .map(n => 
          n.replace(/\u064A$/,"ی")) // "ي" -> "ی"
        .join(" ");

      cn.name = cn.name.replace(/\u0653/g,"") // "آ" -> "ا"
    }else if (cn.lang0.indexOf("Finnish") >= 0) {
      cn.name = (replaceByArray(cn.name, lang_rules["fi"].nameReplacingRules));
    }else if (cn.lang0.indexOf("Greek") >= 0){
      cn.name = (replaceByArray(cn.name, lang_rules["el"].nameReplacingRules));
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }else if (cn.lang0.indexOf("Hebrew") >= 0){
      cn.name = cn.name.toLowerCase()
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }else if (cn.lang0.indexOf("Turkish") >= 0 ){
      cn.name = cn.name.replace(/ı/g, "i")
    }else if (cn.lang0.indexOf("Abkhaz") >= 0 ){
      if (lang_rules["ab"].excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    }else if (cn.lang0.startsWith("Bulgarian")) {
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }else if (cn.lang0.startsWith("Thai")) {
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }

    // re-do some steps in case replacments messed up things
    
    // remove all extra spaces (except in Arabic and Persian)
    if(!cn.lang0.indexOf("Persian") >= 0 && !cn.lang0.indexOf("Arabic") >= 0){
      cn.name = cn.name.replace(/\s*/,"")
    }
    
    // remove diacritics
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