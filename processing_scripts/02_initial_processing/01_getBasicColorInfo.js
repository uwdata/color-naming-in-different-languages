import fs from 'fs'
import Color from "colorjs.io";
import csv from 'csvtojson';
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import hueBinHelper from '../utils/hueBinHelper.js'
import {languages_iso_639} from "../../shared_files/languages-iso-639.js"

const colorSet = JSON.parse(
      fs.readFileSync('../../model/color_info_pre_naming/hue_colors_rgb.json'));

const MIN_FULL_COLOR_NAMES = 12;
const MIN_LINE_COLOR_NAMES = 8
const MIN_PARTICIPANT_IDS_PER_COLOR_NAME = 2
const LINE_RGB_SET = "line";
const FULL_RGB_SET = "full";

function getLangAbv(lang){
  const lang_data = languages_iso_639.find(l => `${l["Language name"]} (${l["Native name"]})` == lang)
  let abv
  if(lang_data){
    abv = lang_data["639‑1"]
  } else{
    abv = lang
    console.log("WARNING: abv not found for " + lang)
  }
  return abv
}

// Path or the input csv file
const FILE_I = "../../model/cleaned_color_names.csv"
const FILE_BASIC_COLOR_O = "../../model/basic_colors_info.csv"; // Path for the output
const FILE_COLOR_BY_NAME_DIR = "../../model/color_info_by_lang/"
const FILE_BASIC_COLOR_BY_LANG_PRE = "basic_colors_info_"
const FILE_BASIC_COLOR_BY_LANG_O = FILE_COLOR_BY_NAME_DIR + FILE_BASIC_COLOR_BY_LANG_PRE; // Path for the output
const FILE_LANG_O = "../../model/lang_info.csv"; // Path for the output

let langDataWriter = csvWriter();
langDataWriter.pipe(fs.createWriteStream(FILE_LANG_O));

// delete all old file_basic_color_by_lang
const byLangFiles = fs.readdirSync(FILE_COLOR_BY_NAME_DIR)
for(const fn of byLangFiles){
  console.log("file name", fn)
  fs.rmSync(FILE_COLOR_BY_NAME_DIR + fn)
}


csv().fromFile(FILE_I)
  .then((colorNames)=>{

  let grouped_lang = d3.groups(colorNames, d => d.lang)
    .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) => a.key.localeCompare(b.key));

  console.log("grouping terms")
  grouped_lang.forEach(lang => {
    lang.terms = d3.groups(lang.values, v => v.name)
                .map(a => {return {key: a[0], values: a[1]}})

    lang.numLineNames = 0 // count line info just for the lang_info summary
    lang.numFullNames = 0

    lang.terms.forEach(term => {
      term.numLineNames = term.values.filter(entry => entry.rgbSet == LINE_RGB_SET).length
      lang.numLineNames += term.numLineNames
      term.numFullNames = term.values.filter(entry => entry.rgbSet == FULL_RGB_SET).length
      lang.numFullNames += term.numFullNames

      term.numParticipantIds = (new Set(term.values.map(a => a.participantId))).size

      term.simplifiedName = term.key;

      // TODO: Get alternate names (e.g., simplified and traditional Chinese script)
      term.commonName = d3.groups(
        lang.values.filter(v => v.name == term.key)
        ,t => t.standardized_entered_name)
        .map(a => {return {key: a[0], values: a[1]}})
        .sort((a,b) => -a.values.length + b.values.length)[0].key;
    })

    lang.terms = lang.terms.filter(g_term => 
      g_term.numParticipantIds >= MIN_PARTICIPANT_IDS_PER_COLOR_NAME && (
        g_term.numFullNames >= MIN_FULL_COLOR_NAMES || 
        g_term.numLineNames >= MIN_LINE_COLOR_NAMES)
      );

    // sort alphabetically by simplifiedName (stable-ish sort)
    lang.terms.sort((a,b) => a.simplifiedName.localeCompare(b.simplifiedName));
  });

  // sort language by lang_abv (secondary "lang") so order in file stays consistent
  grouped_lang.sort((a,b) => a.key.localeCompare(b.key));

  console.log("writing file");
  let basicColorWriter = csvWriter();
  basicColorWriter.pipe(fs.createWriteStream(FILE_BASIC_COLOR_O));

  console.log("calculating averages and outputting")

  grouped_lang.forEach(lang => {
    const langAbv = getLangAbv(lang.key)

    langDataWriter.write({
      lang: lang.key,
      langAbv: langAbv,
      numLineNames: lang.numLineNames,
      numFullNames: lang.numFullNames,
      numLineColorTerms: lang.terms
           .filter(g_term => g_term.numLineNames >= MIN_LINE_COLOR_NAMES)
           .length,
      numFullColorTerms: lang.terms
           .filter(g_term => g_term.numFullNames >= MIN_FULL_COLOR_NAMES)
           .length,
    })

    if(lang.terms.length > 0){
      const basicColorByLangWriter = csvWriter();
      basicColorByLangWriter.pipe(fs.createWriteStream(FILE_BASIC_COLOR_BY_LANG_O + langAbv + ".csv"));
 

      lang.terms.forEach(term => {
        const avgLab = term.numFullNames >= MIN_FULL_COLOR_NAMES ? 
                getAverageFullLABColor(term.values).toGamut() : // Note: simplify to gamut for rounded l,a,b values
                undefined
        const avgHueColor = term.numLineNames >= MIN_LINE_COLOR_NAMES ? 
                getAverageHueColor(term.values)  :
                undefined
                
        const avgSrgb = avgLab ? avgLab.to("srgb") : undefined

        term.avgHueRGBCode = avgHueColor

        term.avgColorRGBCode = avgSrgb ? `rgb(${Math.round(255*avgSrgb.r)},${Math.round(255*avgSrgb.g)},${Math.round(255*avgSrgb.b)})` : undefined
        term.avgL = avgLab ? avgLab.l : undefined
        term.avgA = avgLab ? avgLab.a : undefined
        term.avgB = avgLab ? avgLab.b : undefined

        delete term.values;
        term.lang = lang.key;

        const basicColorEntry = {
          lang: term.lang,
          lang_abv: getLangAbv(term.lang),
          commonName: term.commonName,
          simplifiedName: term.simplifiedName,
          numLineNames: term.numLineNames,
          avgHueRGBCode: term.avgHueRGBCode,
          numFullNames: term.numFullNames,
          avgFullColorRGBCode: term.avgColorRGBCode,
          avgFullL: term.avgL,
          avgFullA: term.avgA,
          avgFullB: term.avgB
        }
        
        basicColorWriter.write(basicColorEntry)
        basicColorByLangWriter.write(basicColorEntry)
      })

      basicColorByLangWriter.end()
    }
  });

  basicColorWriter.end();
  langDataWriter.end();
});

function getAverageHueColor(colorEntries){
  let [x_hue_angle, y_hue_angle] = [0, 0]

  colorEntries = colorEntries.filter((c) => c.rgbSet == "line")

  // TODO: Normalize p3?
  // Naively map p3 colors to match to srgb
  for(const entry of colorEntries){
    if(entry.colorSpace == "p3"){
      entry.r = Math.round(entry.r*255)
      entry.g = Math.round(entry.g*255)
      entry.b = Math.round(entry.b*255)
    } if(entry.colorSpace == "rec2020"){
      console.log("WARNING: mapping rec2020 hue colors, likely quite inaccurate")
      entry.r = Math.round(entry.r*255)
      entry.g = Math.round(entry.g*255)
      entry.b = Math.round(entry.b*255)
    }
  }

  // make sure all values are actually hue colors (some got mislabeled)
  colorEntries = colorEntries
      .filter((c) => Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0)
  
  colorEntries.forEach(response => {
    const colorHueRatio = hueBinHelper.getHueBinHelper(colorSet).getHueColorRatio(response)
    x_hue_angle += Math.cos(colorHueRatio * 2*Math.PI),
    y_hue_angle += Math.sin(colorHueRatio * 2*Math.PI)
  });
  let angle = Math.atan(y_hue_angle / x_hue_angle)
  if(x_hue_angle < 0){
    angle += Math.PI 
  } else if (y_hue_angle < 0){
    angle += 2 * Math.PI
  } 
  const avgHueColor = hueBinHelper.getHueBinHelper(colorSet).getHueColorFromRatio(angle / (2*Math.PI))
  return d3.rgb(avgHueColor.r, avgHueColor.g, avgHueColor.b);
}

function getAverageFullLABColor(colorEntries){
  let l_sum = 0
  let a_sum = 0
  let b_sum = 0
  for(const colorEntry of colorEntries){
    let color
    if(colorEntry.colorSpace == "rgb"){
      color = new Color({
          space: "srgb", coords: [colorEntry.r/255, colorEntry.g/255, colorEntry.b/255]
        }).to("oklab")
      } else {
        color = new Color({
          space: colorEntry.colorSpace, coords: [colorEntry.r, colorEntry.g, colorEntry.b]
        })
        .to("srgb").toGamut() // For now we reduce all color spaces to rgb until we have enough data to estimate transformation
        .to("oklab")
      }
    
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

