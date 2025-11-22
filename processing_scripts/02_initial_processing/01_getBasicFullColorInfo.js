import fs from 'fs'
import Color from "colorjs.io";
import csv from 'csvtojson';
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import {languages_iso_639} from "../../shared_files/languages-iso-639.js"

const MIN_FULL_COLOR_NAMES = 12;
const LINE_RGB_SET = "line";
const FULL_RGB_SET = "full";

function getLangAbv(lang){
  const lang_data = languages_iso_639.find(l => `${l["Language name"]} (${l["Native name"]})` == lang)
  let abv
  if(lang_data){
    abv = lang_data["639‑1"]
  } else{
    console.log("WARNING: abv not found for " + lang)
  }
  return abv
}

// Path or the input csv file
const FILE_I = "../../model/cleaned_color_names.csv"
const FILE_BASIC_COLOR_O = "../../model/full_colors_info.csv"; // Path for the output
const FILE_LANG_O = "../../model/lang_info.csv"; // Path for the output

let langDataWriter = csvWriter();
langDataWriter.pipe(fs.createWriteStream(FILE_LANG_O));

csv().fromFile(FILE_I)
  .then((colorNames)=>{

  let grouped_lang = d3.groups(colorNames, d => d.lang0)
    .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) =>  - a.values.length + b.values.length);

  grouped_lang.forEach(lang => {
    lang.terms = d3.groups(lang.values, v => v.name)
                .map(a => {return {key: a[0], values: a[1]}})
                .sort((a,b) => -a.values.length + b.values.length);

    lang.numLineNames = 0 // count line info just for the lang_info summary
    lang.numFullNames = 0

    lang.terms.forEach(term => {
      term.numLineNames = term.values.filter(entry => entry.rgbSet == LINE_RGB_SET).length
      lang.numLineNames += term.numLineNames
      term.numFullNames = term.values.filter(entry => entry.rgbSet == FULL_RGB_SET).length
      lang.numFullNames += term.numFullNames

      term.simplifiedName = term.key;
      term.commonName = d3.groups(
        lang.values.filter(v => v.name == term.key)
        ,t => t.standardized_entered_name)
        .map(a => {return {key: a[0], values: a[1]}})
        .sort((a,b) => -a.values.length + b.values.length)[0].key;
    })

    lang.terms = lang.terms.filter(g_term => g_term.numFullNames >= MIN_FULL_COLOR_NAMES);

    lang.terms.sort((a,b) => -a.numFullNames + b.numFullNames);
  });

  grouped_lang.sort((a,b) =>  - a.terms.length + b.terms.length);

  console.log("writing file");
  let basicColorWriter = csvWriter();
  basicColorWriter.pipe(fs.createWriteStream(FILE_BASIC_COLOR_O));

  grouped_lang.forEach(lang => {

    langDataWriter.write({
      lang: lang.key,
      langAbv: getLangAbv(lang.key),
      numLineNames: lang.numLineNames,
      numFullNames: lang.numFullNames,
      numColorTerms: lang.terms.length,
    })

    lang.terms.forEach(term => {
      const avgLab = getAverageLABColor(term.values)
      const avgSrgb = avgLab.to("srgb")

      term.avgColorRGBCode = `rgb(${Math.round(255*avgSrgb.r)},${Math.round(255*avgSrgb.g)},${Math.round(255*avgSrgb.b)})`
      term.avgL = avgLab.l
      term.avgA = avgLab.a
      term.avgB = avgLab.b

      delete term.values;
      term.lang = lang.key;
      basicColorWriter.write({
        lang: term.lang,
        lang_abv: getLangAbv(term.lang),
        commonName: term.commonName,
        simplifiedName: term.simplifiedName,
        avgColorRGBCode: term.avgColorRGBCode,
        totalColorFraction: term.numFullNames / lang.numFullNames,
        avgL: term.avgL,
        avgA: term.avgA,
        avgB: term.avgB,
        numFullNames: term.numFullNames,
        numLineNames: term.numLineNames,
      });
    })
  });

  basicColorWriter.end();
  langDataWriter.end();
});



function getAverageLABColor(colorEntries){
  let l_sum = 0
  let a_sum = 0
  let b_sum = 0
  for(const colorEntry of colorEntries){
    const color = new Color({
        space: "srgb", coords: [colorEntry.r/255, colorEntry.g/255, colorEntry.b/255]
      }).to("oklab")
    
    l_sum += color.l
    a_sum += color.a
    b_sum += color.b
  }

  return new Color({
    space: "oklab", coords: [
      l_sum / colorEntries.length,
      a_sum / colorEntries.length,
      b_sum / colorEntries.length,
    ]})
}

