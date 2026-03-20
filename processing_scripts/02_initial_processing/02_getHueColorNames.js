// TODO: This currently assumes only srgb data. It will need to be adapted for p3 and rec2020
import fs from 'fs'
import csv from 'csvtojson';
import Color from "colorjs.io";
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import hueBinHelper from '../utils/hueBinHelper.js'

const N_BIN_OPTIONS = [120, 72, 36]
const HUE_BIN_RES_SIZES = {
  "low": 36,
  "med": 72,
  "high": 120
}

// Restrict languages to those that have an average minimum number of terms per bin
//  (note: blur allows more languages to be included since entries get double counted)
const MIN_TERM_ENTRIES_PER_BIN = 8


const NO_BLUR = "no-blur"
const BLUR = "blur"
const BLUR_EXPONENT = 1.5

const I_FILE = "../../model/cleaned_color_names.csv"
const I_BASIC_COLOR_INFO_FILE = "../../model/basic_colors_info.csv"
const O_FILE_NAME = `../../model/binned_hue_colors/hue_color_names_binned_`;
const O_AGGREGATE = `aggregated`;
const O_HUE_SUMMARY_FILE = `../../model/hue_colors_info.csv`;

const colorSet = JSON.parse(
      fs.readFileSync('../../model/color_info_pre_naming/hue_colors_rgb.json'));

const langAbvToLang = {}

let colorNames = await csv().fromFile(I_FILE)
let basicColorInfo = await csv().fromFile(I_BASIC_COLOR_INFO_FILE)


colorNames = colorNames.filter(cn => cn.rgbSet === "line");

// TODO: Proper calculation of offset of these
// Naively map p3/rec2020 colors to match to srgb
for(const entry of colorNames){
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
colorNames = colorNames.filter((response) => Math.max(response.r, response.g, response.b) == 255 && Math.min(response.r, response.g, response.b) == 0)

// blur info
const blurWeights = {}
let totalBlurWeight = 0
for(let i = -2; i <= 2; i++){
  const blurFraction = Math.pow(2, - BLUR_EXPONENT * Math.abs(i))
  blurWeights[i] = blurFraction
  totalBlurWeight += blurFraction
}

const hue_colors_info = {}

for(const n_bins of N_BIN_OPTIONS){
  const hueColorBins = await csv().fromFile(`../../model/color_info_pre_naming/hue_color_bins_${n_bins}_rgb.csv`)

  for(const blur of [NO_BLUR, BLUR]){
  
    console.log("Calculating bins", n_bins, blur)
    //There is a possible priming effect for studies with version 1.1.4, but we'll ignore that for now
    // We also won't remove participants who got assigned id of 0 due to a bug (as we had previously done)
    //colorNames = colorNames.filter(cn => cn.participantId != 0);


    // 1. Get languages
    let groupedByLang = d3.groups(colorNames, d => d.lang)
      .map(a => {return {key: a[0], values: a[1]}})
      .sort((a,b) => a.key.localeCompare(b.key));
      

    // 2. Get terms by lang
    groupedByLang.forEach((lang) => {
      lang.terms = d3.groups(lang.values, v => v.name)
        .map(a => {return {key: a[0], values: a[1]}})

      lang.terms = lang.terms
      // filter for terms that were deemed as having enough hue data in basic color info
        .filter(t => {
          const bci = basicColorInfo.find(
            bci => bci.lang === lang.key && bci.simplifiedName == t.key)
          if(bci){
            if(bci.avgHueRGBCode !== ""){
              return true
            }
          }
          return false
        })

      for(const term of lang.terms){
        const bci = basicColorInfo.find(bci => bci.lang === lang.key && bci.simplifiedName == term.key)
        //find most common name for term
        term.commonName = bci.commonName
      }
      
      lang.terms.sort((a, b) => 
        a.key.localeCompare(b.key))
    });



    // 3. Group the data into bins
    let langTermAggregated = {};
    const langTermInfo = {}
    const binInfoByLang = {}

    groupedByLang.forEach(langData => {
      if(langData.terms.length == 0){
        return
      }
      let langTotalCount = 0

      // create binInfo
      binInfoByLang[langData.key] = []
      const thisBinsInfo = binInfoByLang[langData.key]
      for(const [i, u] of Array(n_bins).entries()){
        thisBinsInfo[i] = {
          binNum: i,
          totalEntryCount: 0,
          termCounts: {},
          termPTCs: {},
          termPCTs: {}
        }
      }


      // place responses in bins
      langData.terms.forEach(term => {
        term.totalCount = 0
        term.values.forEach(response => {
          term.totalCount += 1
          langTotalCount += 1
          const thisBin = thisBinsInfo[binNum(response, hueColorBins)]
          thisBin.totalEntryCount += 1;
          if(!(term.key in thisBin.termCounts)){
            thisBin.termCounts[term.key] = 0
          }
          thisBin.termCounts[term.key] += 1
        })
      })

      // calculate p(Term | Color Bin) for each bin
      // including with blur
      for(const thisBin of thisBinsInfo){

        if(blur == NO_BLUR){
          // find p(T|C) for each term
          for(const term of Object.keys(thisBin.termCounts)){
            thisBin.termPTCs[term] = thisBin.termCounts[term] / thisBin.totalEntryCount
          }

        } else { // blur

          const weightedBins = Object.entries(blurWeights).map(b => {
            const i = (thisBin.binNum +parseInt(b[0]) + n_bins) % n_bins
            return {
              blurWeight: thisBinsInfo[i].totalEntryCount >= MIN_TERM_ENTRIES_PER_BIN ?
                 b[1] :
                 b[1] * thisBinsInfo[i].totalEntryCount / MIN_TERM_ENTRIES_PER_BIN, // if bin has less than MIN_TERM_ENTRIES_PER_BIN, reduce the weight
              binInfo: thisBinsInfo[i]
            }
          })

          const totalBinEntryCountBlur = weightedBins.map(wb => wb.blurWeight * wb.binInfo.totalEntryCount).reduce((a, b) => a+b)
          const binAllTerms = new Set(weightedBins.flatMap(wb => Object.keys(wb.binInfo.termCounts)))
          
          // find p(T|C) for each term
          for(const term of binAllTerms){
            const termCountBlur = weightedBins.map(wb => 
                wb.blurWeight * 
                  (term in wb.binInfo.termCounts ? wb.binInfo.termCounts[term] : 0))
              .reduce((a, b) => a+b)
              
            const pTC = termCountBlur / totalBinEntryCountBlur
            if(pTC !== undefined && pTC > 0){
              thisBin.termPTCs[term] = pTC
            }
          }
        }
      }

      // find p(Color Bin | Term)
      // and total color fraction
      for(const term of langData.terms){
        const termTotalPTC = thisBinsInfo
          .map(b => term.key in b.termPTCs? b.termPTCs[term.key] : 0)
          .reduce((a, b) => a+b)

        term.totalColorFraction = termTotalPTC / n_bins

        for(const thisBin of thisBinsInfo){
          const pCT = term.key in thisBin.termPTCs ? thisBin.termPTCs[term.key] / termTotalPTC : undefined
          if(pCT !== undefined){
            thisBin.termPCTs[term.key] = pCT
          }
        }
      }

      // find average color 
      for(const term of langData.terms){
        let x_hue_angle = 0
        let y_hue_angle = 0

        for(const thisBin of thisBinsInfo){
          const pCT = term.key in thisBin.termPCTs ? thisBin.termPCTs[term.key] : 0
          const colorHueRatio = thisBin.binNum / n_bins
          x_hue_angle += pCT * Math.cos(colorHueRatio * 2*Math.PI),
          y_hue_angle += pCT * Math.sin(colorHueRatio * 2*Math.PI)
        }

        const angle = Math.atan2(y_hue_angle, x_hue_angle)
        let ratio = angle / (2*Math.PI)
        if(ratio + 1 < 1){
          ratio += 1
        }
        const avgHueColor = hueBinHelper.getHueBinHelper(colorSet).getHueColorFromRatio(ratio)

        term.avgHueColor = d3.rgb(avgHueColor.r, avgHueColor.g, avgHueColor.b)
      } 

      langData.terms.sort((a,b) => a.key.localeCompare(b.key))
 

      // put data into data structures for writing to files
      // and limit which languages are displayed
      // based on average entries per bin
      if(
        (blur == BLUR ? langTotalCount * totalBlurWeight: langTotalCount)
          > MIN_TERM_ENTRIES_PER_BIN * n_bins){ 

        let lang_abv = langData.terms[0].values[0].langAbv//langData.key
        langAbvToLang[lang_abv] = langData.terms[0].values[0].lang


        langTermAggregated[lang_abv] = {
          'colorNameBinCounts': langData.terms.map(t => thisBinsInfo.map(b => t.key in b.termCounts ? b.termCounts[t.key] : 0)),
          'colorNameCount': langData.terms.map(t => t.totalCount),
          'terms': langData.terms.map(t => t.key),
          'commonNames': langData.terms.map(t => t.commonName),
          'termTotalCount': langTotalCount,
          'totalColorFraction': langData.terms.map(t => t.totalColorFraction),
          'pTCs': langData.terms.map(t => thisBinsInfo.map(b => t.key in b.termPTCs ? b.termPTCs[t.key] : 0)),
          'avgHueColor': langData.terms.map(t => t.avgHueColor)
        };
      

        langTermInfo[lang_abv] = {}

        for(const term of langData.terms){

          langTermInfo[lang_abv][term.key] = {
            simplifiedName: term.key,
            commonName: term.commonName,
            totalColorFraction: term.totalColorFraction,
            cnt: term.totalCount,
            bins: []
          }

          if(blur == BLUR){
            langTermInfo[lang_abv][term.key].blur_cnt= term.totalCount * totalBlurWeight
          }

          for(const thisBin of thisBinsInfo){
          //if(thisBin.termCounts[term] || thisBin.termPCTs[term]){
            langTermInfo[lang_abv][term.key].bins[thisBin.binNum] = {
              cnt: thisBin.termCounts[term.key] ? thisBin.termCounts[term.key] : 0,
              pCT: thisBin.termPCTs[term.key] ? thisBin.termPCTs[term.key] : 0,
              pTC: thisBin.termPCTs[term.key] ? thisBin.termPCTs[term.key] : 0
            }
          }

        }

        // fill in the hue_colors_info
        // with summaries of each color based on the binning sizes
        // use blur values
        if(Object.values(HUE_BIN_RES_SIZES).includes(n_bins) && blur == BLUR){
          const binRes = Object.keys(HUE_BIN_RES_SIZES).find(key => HUE_BIN_RES_SIZES[key] == n_bins)

          // Make initial entries if needed
          if(!(langData.key in hue_colors_info)){
            hue_colors_info[langData.key] = {}
          }

          for(const term of langData.terms){
            if(!(term.key in hue_colors_info[langData.key])){
              hue_colors_info[langData.key][term.key] = {
                lang: langData.key,
                lang_abv: lang_abv,
                commonName: term.commonName,
                simplifiedName: term.key
              }
            }

            const avgColor = new Color({
              space: "sRGB", coords: [term.avgHueColor.r, term.avgHueColor.g, term.avgHueColor.b]
            })
            const avgColorOkLab = avgColor.to("oklab").toGamut()
  
            hue_colors_info[langData.key][term.key][binRes + "ResBlurTermFraction"] = term.totalColorFraction
            hue_colors_info[langData.key][term.key][binRes + "ResBlurAvgRGBCode"] = term.avgHueColor,
            hue_colors_info[langData.key][term.key][binRes + "ResBlurAvgL"] = avgColorOkLab.l
            hue_colors_info[langData.key][term.key][binRes + "ResBlurAvgA"] = avgColorOkLab.a
            hue_colors_info[langData.key][term.key][binRes + "ResBlurAvgB"] = avgColorOkLab.b
          }
        }
      }
    });


    langTermAggregated.colorSet = hueColorBins.map(function(bin, i, array){
      return{
        r: bin.bin_center_r,
        g: bin.bin_center_g,
        b: bin.bin_center_b
      }
    });

    // Export the data


    let blur_text = ""
    if(blur == BLUR){
      blur_text = "_blur"
    }
    fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}_${O_AGGREGATE}.json`, JSON.stringify(langTermAggregated, null, 2));
    

    fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}.json`, JSON.stringify(langTermInfo, null));
  }
}


// export overall color info
const hueColorInfoWriter = csvWriter({
  headers: ["lang","lang_abv","commonName","simplifiedName",
    "lowResBlurTermFraction","lowResBlurAvgRGBCode","lowResBlurAvgL","lowResBlurAvgA","lowResBlurAvgB",
    "medResBlurTermFraction","medResBlurAvgRGBCode","medResBlurAvgL","medResBlurAvgA","medResBlurAvgB",
    "highResBlurTermFraction","highResBlurAvgRGBCode","highResBlurAvgL","highResBlurAvgA","highResBlurAvgB"
  ]
});
const hueColorInfoWriteStream = fs.createWriteStream(O_HUE_SUMMARY_FILE)
hueColorInfoWriter.pipe(hueColorInfoWriteStream);

for(const [lang, hue_color_lang_row] of Object.entries(hue_colors_info).sort((a, b) => a[0].localeCompare(b[0]))){
  for(const [term, term_color_row] of Object.entries(hue_color_lang_row).sort((a, b) => a[0].localeCompare(b[0]))){
     hueColorInfoWriter.write(term_color_row)
  }
}



function binNum(response, hueColorBins){
  const responseRatio = hueBinHelper.getHueBinHelper(colorSet).getHueColorRatio(response)
  for(const [bin_i, bin] of hueColorBins.entries()){
    if(!bin.binStartRatio){
      bin.binStartRatio = hueBinHelper.getHueBinHelper(colorSet).getHueColorRatio({
        r: bin.bin_start_r,
        g: bin.bin_start_g,
        b: bin.bin_start_b
      })
    }

    if(!bin.binEndRatio){
      bin.binEndRatio = hueBinHelper.getHueBinHelper(colorSet).getHueColorRatio({
      r: bin.bin_end_before_r,
      g: bin.bin_end_before_g,
      b: bin.bin_end_before_b
    })
    }

    if(bin.binStartRatio < bin.binEndRatio){
      if(responseRatio >= bin.binStartRatio && responseRatio < bin.binEndRatio){
        return bin_i
      }
    } else {
      if(responseRatio >= bin.binStartRatio || responseRatio < bin.binEndRatio){
        return bin_i
      }
    }
  }
  throw new Error("Error, hue color not found in color set: ", response)
}