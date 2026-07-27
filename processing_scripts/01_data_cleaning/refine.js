import fs from "fs";
import csv from 'csvtojson';

// load participants to exclude because they entered the wrong language or they entered nonsense
const participants_to_exclude = (await csv().fromFile("participants_to_exclude.csv"))
                                .map(a => a.participantId)

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


// standardize the entered names (these will be chosen between for display)
//    do things trim ending white space and making all lowercase,
//    and in some languages (e.g., Korean, Chinese) add a standardized ending,
//    so display name will be consistent with those characteristics
function standardize_entered(cn){
  let name = cn.name
    .normalize("NFC")
    .replace(/\s*[-_]\s*/, " ")

  name = name.toString().trim().toLowerCase()

  if(lang_rules[cn.langAbv]){
    let standardizedEnds = lang_rules[cn.langAbv].standardizedEnds

    if(standardizedEnds){    
      
      let hasStandardEnd = false

      for(let se of standardizedEnds){
        se = se.normalize("NFC")
        if(name.endsWith(se)){
          hasStandardEnd = true
        }
      } 

      if(name.length > 0 && !hasStandardEnd){
          name += standardizedEnds.at(-1).normalize("NFC") // last option
      }
    }
  }
  return name
}


// For a given color name, clean it up for matching or remove it
async function refine(cn){

    // remove participants with ids specifically marked for removal
    if(participants_to_exclude.includes(String(cn.participantId))){
      cn.name = ""
      cn.reason_excluded = "participant id"
      return
    }

    // general refine:
    // remove diacritics:
    cn.name = cn.name
      .toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")

    if(cn.langAbv in lang_rules){
      const langRules = lang_rules[cn.langAbv]

      cn.name = cn.name
        .toLowerCase() // (did we already do this? duplicate? ) // TODO: start with standardized name
        .replace(/\s*$/,"") // trim white space
        .replace(/^\s*/,"")
        .replace(/[-_]+/g," ")
        .replace(/\s+/g," ")
        ; // turn dashes into spaces

      if("convertScript" in langRules){
        cn.name = await langRules.convertScript(cn.name)
      }

      // remove standardized end (though doesn't work for Korean for some reason???)
      if("standardizedEnds" in langRules){
        if(cn.name.endsWith(langRules.standardizedEnds[0].normalize("NFD"))){
          cn.name = cn.name.slice(0, cn.name.length - langRules.standardizedEnds[0].normalize("NFD").length)
        }
      }

      // remove any "removedEnds"
      if("removedEnds" in langRules){
        for(const removedEnd of langRules.removedEnds){
          if(cn.name.endsWith(removedEnd)){
            cn.name = cn.name.slice(0, cn.name.length - removedEnd.length)
          }
        }
      }

      if("nameReplacingRules" in langRules){
        cn.name = replaceByArray(cn.name, langRules.nameReplacingRules)
      }
      
      if("excludeNames" in langRules && langRules.excludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
        cn.reason_excluded = "excluded name"
        return
      }

      if("forbiddenCharacters" in langRules){
        if((langRules.forbiddenCharacters).test(cn.name)){
          cn.name = "";
          cn.reason_excluded = "forbidden characters"
          return
        }
      }

      if("ignoreCharactersForMatching" in langRules){
        cn.name = cn.name.replace(langRules.ignoreCharactersForMatching,"")
          // TODO: ban words outright
          .replace(/\s*$/,"") // trim white space
          .replace(/^\s*/,"")
          .replace(/\s+/g," ")
        if(cn.name == ""){
          cn.reason_excluded = "ignoring characters left nothing"
          return
        }
      }
      // TODO: Remove this when forbidden characters are removed outright
      if("nameReplacingRules" in langRules){
        cn.name = replaceByArray(cn.name, langRules.nameReplacingRules)
      }

      if("additionalReplacementRule" in langRules){
        cn.name = langRules.additionalReplacementRule(cn.name)
      }
    }

    // re-do some steps in case replacements messed up things
    
    // remove all extra spaces (except where spaces are more needed, like in Arabic and Persian)
    if(!(cn.langAbv in lang_rules) || !("keepSpaces" in lang_rules[cn.langAbv]) || !lang_rules[cn.langAbv].keepSpaces){
      cn.name = cn.name.replace(/\s*/g,"")
    }
    
    // ensure diacritics removed (in case replacement rules introduced them)
    cn.name = cn.name.trim().toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
};


function replaceByArray(string, array){
  array.forEach(function(pattern){
    if(!pattern){
      console.error("name replacement pattern incorrectly formatted (perhaps missing comma?):", pattern, "\nall patterns:", array)
    }
    // Normalize Unicode encoding
    let pattern0 = pattern[0]
    if(typeof pattern0 === "string"){
      pattern0 = pattern0.normalize("NFD")
    } else if(pattern0.constructor.name === "RegExp"){
      pattern0 = new RegExp(pattern0.source.normalize("NFD"), pattern0.flags)
    }

    // do the replacement
    string = string.replace(pattern0,pattern[1]);
  });
  return string;
}

export {refine, standardize_entered};