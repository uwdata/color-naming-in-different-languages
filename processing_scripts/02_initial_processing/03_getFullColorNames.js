import fs from 'fs'
import Color from "colorjs.io";
import csv from 'csvtojson';
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import zlib from 'zlib'
import * as labBinHelperLib from '../utils/labBinHelper.js'
import * as fullBinPlacement from '../utils/fullBinPlacement.js'
 

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES
  .filter(binSize => !(binSize.h_divs == 3)) // don't bother with the ring bins with h_divs of 3 as I don't think they look that good


const LAB_BIN_RES_SIZES = {
  "tiny": LAB_BIN_SIZES[0],
  "low": LAB_BIN_SIZES[1],
  "med": LAB_BIN_SIZES[2],
  "high": LAB_BIN_SIZES[3]
}

const I_NAMES_DATA_FILE = "../../model/cleaned_color_names.csv"
const I_BASIC_COLOR_INFO_FILE = "../../model/basic_colors_info.csv"
const I_LANG_INFO_FILE = "../../model/lang_info.csv"

const FILE_FULL_COLOR_O = "../../model/full_colors_info.csv"; // Path for the output
const FILE_O = "../../model/binned_full_colors/full_color_names_binned";
const FILE_O_SALIENCY = "../../model/binned_full_colors/full_color_map_saliency_bins"
const FILE_LANG_BIN_O = "../../model/binned_full_colors/full_color_lang_bin_info.csv"
const FILE_LANG_BIN_BLUR_O = "../../model/binned_full_colors/full_color_lang_bin_blur_info.csv"


const colorNames = await csv().fromFile(I_NAMES_DATA_FILE)
const basicColorInfo = await csv().fromFile(I_BASIC_COLOR_INFO_FILE)
const lang_info = await csv().fromFile(I_LANG_INFO_FILE)

const full_colors_info = {}
const fullColorInfoWriter = csvWriter({
  headers: ["lang","lang_abv","commonName","simplifiedName",
    "tinyResBlurTermFraction","tinyResBlurAvgRGBCode","tinyResBlurAvgL","tinyResBlurAvgA","tinyResBlurAvgB",
    "lowResBlurTermFraction","lowResBlurAvgRGBCode","lowResBlurAvgL","lowResBlurAvgA","lowResBlurAvgB",
    "medResBlurTermFraction","medResBlurAvgRGBCode","medResBlurAvgL","medResBlurAvgA","medResBlurAvgB",
    "highResBlurTermFraction","highResBlurAvgRGBCode","highResBlurAvgL","highResBlurAvgA","highResBlurAvgB"
  ]
});
const fullColorInfoWriteStream = fs.createWriteStream(FILE_FULL_COLOR_O)
fullColorInfoWriter.pipe(fullColorInfoWriteStream);

const lang_bin_info = {}
const lang_bin_blur_info = {}


// Store basic color lookup info
const basicColorInfoLookup = {}
basicColorInfo.forEach(ci => {
  if(!basicColorInfoLookup[ci.lang]){
    basicColorInfoLookup[ci.lang] = [];
  }
  basicColorInfoLookup[ci.lang][ci.simplifiedName] = ci;
});


// Do the initial grouping of terms
let grouped_lang = d3.groups(colorNames, d => d.lang)
    .map(a => {return {key: a[0], values: a[1]}})

for(const langData of grouped_lang){
  langData.terms = d3.groups(langData.values, v => v.name)
              .map(a => {return {key: a[0], values: a[1]}})

  langData.terms = langData.terms
        // limit to terms that had enough data to find avg full color in basic colors info
        .filter(g_term => 
            basicColorInfoLookup[langData.key] && basicColorInfoLookup[langData.key][g_term.key] 
            && basicColorInfoLookup[langData.key][g_term.key].avgFullColorRGBCode)
        .sort((a, b) => a.key.localeCompare(b.key));
}

// make sure at least 1 color term to try binning
grouped_lang = grouped_lang
                .filter(g => g.terms.length > 0)
                .sort((a, b) => a.key.localeCompare(b.key));

// Convert all response colors to sRGB for now
for(const langData of grouped_lang){
  for(const term of langData.terms){
    for(const response of term.values){
      if(response.colorSpace == "rgb"){
        response.responseColor = new Color({
          space: "srgb", coords: [response.r/255, response.g/255, response.b/255]
        })
      } else {
        // For now we naively treat all color spaces as srgb until we have enough data to estimate transformation
        response.responseColor = new Color({
          space: "srgb", coords: [Math.round(response.r*255)/255, Math.round(response.g*255)/255, Math.round(response.b*255)/255]
        })
      }

      response.responseOklch = response.responseColor.to("oklch");
      response.responseOklab = response.responseColor.to("oklab");

    }
  }
}

for(let labBinSize of LAB_BIN_SIZES){
  console.log("calculating full colors for bin size " + labBinSize)

  const binResSizeString = Object.values(LAB_BIN_RES_SIZES).includes(labBinSize) ? Object.keys(LAB_BIN_RES_SIZES).find(key => LAB_BIN_RES_SIZES[key] == labBinSize) : undefined


  const binnedPlacementInfo = fullBinPlacement.fullBinPlacement(lang_info, grouped_lang, basicColorInfoLookup, labBinSize, binResSizeString)

  // merge binnedPlacementInfo.full_colors_info into full_colors_info
  for(const [lang, langData] of Object.entries(binnedPlacementInfo.full_colors_info)){
    if(!(lang in full_colors_info)){
      full_colors_info[lang] = langData
    } else {
      for(const [term, termData] of Object.entries(langData)){
        if(!(term in full_colors_info[lang])){
          full_colors_info[lang][term] = termData
        } else {
          full_colors_info[lang][term] = {...full_colors_info[lang][term], ...termData}
        }
      }
    }
  }
  // merge lang_bin_info
  for(const [lang, langData] of Object.entries(binnedPlacementInfo.lang_bin_info)){
    if(!(lang in lang_bin_info)){
      lang_bin_info[lang] = {
        lang: langData.lang,
        langAbv: langData.langAbv
      }
    }
    lang_bin_info[lang][`num_bins_${labBinSize}`] = langData.num_bins
    lang_bin_info[lang][`fraction_bins_${labBinSize}`] = langData.fraction_bins
  }

  // merge lang_bin_blur_info
  for(const [lang, langData] of Object.entries(binnedPlacementInfo.lang_bin_blur_info)){
    if(!(lang in lang_bin_blur_info)){
      lang_bin_blur_info[lang] = {
        lang: langData.lang,
        langAbv: langData.langAbv
      }
    }
    lang_bin_blur_info[lang][`num_bins_${labBinSize}`] = langData.num_bins
    lang_bin_blur_info[lang][`fraction_bins_${labBinSize}`] = langData.fraction_bins
  }

  fs.writeFileSync(FILE_O + "_"+labBinSize+".json", JSON.stringify(binnedPlacementInfo.flatten));
  
  // gzip these files since they are getting very large
  fs.writeFileSync(
    FILE_O + "_blur_"+labBinSize+".json.gz", 
    zlib.gzipSync(Buffer.from(JSON.stringify(binnedPlacementInfo.flattenBlur), 'utf-8')))


  fs.writeFileSync(FILE_O_SALIENCY + "_"+labBinSize+".json", JSON.stringify(binnedPlacementInfo.saliency))
  fs.writeFileSync(FILE_O_SALIENCY + "_blur_"+labBinSize+".json", JSON.stringify(binnedPlacementInfo.saliencyBlur))


  // if all bins are done for full_colors_info (should only be on the high res bin), then output it
  if(labBinSize == LAB_BIN_RES_SIZES.high){
    console.log("starting writing full_colors_info")
    for(const [lang, lang_color_info_entry] of Object.entries(full_colors_info)){
      for(const [term, term_color_info_entry] of Object.entries(lang_color_info_entry)){
        fullColorInfoWriter.write(term_color_info_entry)
      }
    }
    fullColorInfoWriter.end();
    // make sure file is written (memory garbage collection seems to kill it)
    await new Promise(resolve => fullColorInfoWriter.on("finish", resolve));
    await new Promise(resolve => fullColorInfoWriteStream.on("finish", resolve));
    console.log("finished writing full_colors_info")
  }
}

// TODO: Make by_lang subfolder with each of these as separate jsons? csvs?
let langBinInfoWriter = csvWriter();
langBinInfoWriter.pipe(fs.createWriteStream(FILE_LANG_BIN_O));
for(const [lang, lang_bin_info_entry] of (Object.entries(lang_bin_info).sort((a, b) => a[1].lang.localeCompare(b[1].lang)))){
  langBinInfoWriter.write(lang_bin_info_entry)
}
langBinInfoWriter.end();

let langBinBlurInfoWriter = csvWriter();
langBinBlurInfoWriter.pipe(fs.createWriteStream(FILE_LANG_BIN_BLUR_O));
for(const [lang, lang_bin_blur_info_entry] of (Object.entries(lang_bin_blur_info).sort((a, b) => a[1].lang.localeCompare(b[1].lang)))){
  langBinBlurInfoWriter.write(lang_bin_blur_info_entry)
}
langBinBlurInfoWriter.end();


