// TODO: This currently assumes only srgb data. It will need to be adapted for p3 and rec2020
import fs from 'fs'
import csv from 'csvtojson';
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import hueBinHelper from '../utils/hueBinHelper.js'

const N_BIN_OPTIONS = [120, 72, 36]

const MIN_ENTRIES_PER_TERM = 8 // make sure each term is named a minimum number of times to count it

// Restrict languages to those that have an average minimum number of terms per bin
//  (note: blur allows more languages to be included since entries get double counted)
const MIN_TERMS_PER_BIN = 15


const NO_BLUR = "no-blur"
const BLUR = "blur"
const BLUR_EXPONENT = 1.5

const I_FILE = "../../model/cleaned_color_names.csv"
const O_FILE_NAME = `../../model/binned_hue_colors/hue_color_names_binned_`;
const O_AGGREGATE = `aggregated`;
const O_HUE_SUMMARY_FILE = `../../model/hue_colors_info.csv`;

const colorSet = JSON.parse(
      fs.readFileSync('../../model/color_info_pre_naming/hue_colors_rgb.json'));

const langAbvToLang = {}

csv()
.fromFile(I_FILE)
.then(async (colorNames)=>{
  const hue_colors_info = []

  for(const n_bins of N_BIN_OPTIONS){
    const hueColorBins = await csv().fromFile(`../../model/color_info_pre_naming/hue_color_bins_${n_bins}_rgb.csv`)

    for(const blur of [NO_BLUR, BLUR]){
    
      console.log("Calculating bins", n_bins, blur)
      //There is a possible priming effect for studies with version 1.1.4, but we'll ignore that for now
      // We also won't remove participants who got assigned id of 0 due to a bug (as we had previously done)
      //colorNames = colorNames.filter(cn => cn.participantId != 0);
      colorNames = colorNames.filter(cn => cn.rgbSet === "line");


      // 1. Get top languages
      let groupedByLang = d3.groups(colorNames, d => d.lang)
        .map(a => {return {key: a[0], values: a[1]}})
        .sort((a,b) => a.key.localeCompare(b.key));
        

      // 2. Get top terms
      groupedByLang.forEach((lang) => {
        lang.terms = d3.groups(lang.values, v => v.name)
          .map(a => {return {key: a[0], values: a[1]}})
          .sort((a,b) => -a.values.length + b.values.length);

        let rankLookUp = lang.terms.map(t => t.values.length);
        
        lang.topNTerms = lang.terms
          .filter(t => t.values.length >= MIN_ENTRIES_PER_TERM)

        lang.terms.forEach(t => {
          t.rank = rankLookUp.indexOf(t.values.length) + 1;
        });

      });



      // 3. Group the data into bins
      //let bin = colorBins.genBin(n_bins);
      let langTermAggregated = {};
      //let flatten = [];
      const langTermInfo = {}


      groupedByLang.forEach(langData => {
        let termBinsRows = [];
        let terms = [];
        let mapped = {
          'colorNameBinCounts': [],
          'colorNameCount': [],
          'terms': [],
          'commonNames': [],
          'totalCount' : 0,
          'avgHueColor': []
        }
        if(blur == BLUR){
          mapped.totalCountBlur = 0
        }
        langData.topNTerms.forEach(term => {
          mapped.terms.push(term.key);

          //find most common name for term
          let commonName = d3.groups(
            langData.values.filter(v => v.name == term.key),
            t => t.standardized_entered_name)
                  .map(a => {return {key: a[0], values: a[1]}})
                  .sort((a,b) => -a.values.length + b.values.length)[0].key;
          mapped.commonNames.push(commonName)
          
          let colorNameCnt = new Array(n_bins).fill(0);
          let termNameCnt = 0
          let [x_hue_angle, y_hue_angle] = [0, 0]

          // make sure all values are actually hue colors (some got mislabeled)
          term.values = term.values.filter((response) => Math.max(response.r, response.g, response.b) == 255 && Math.min(response.r, response.g, response.b) == 0)

          term.values.forEach(response => {
            if(blur == NO_BLUR){
              colorNameCnt[binNum(response, hueColorBins)] += 1;
              termNameCnt += 1
            } else { //blur
              // allow blur to go two to the side
              for(let i = -2; i <= 2; i++){
                const blurFraction = Math.pow(2, - BLUR_EXPONENT * Math.abs(i))
                termNameCnt += blurFraction
                colorNameCnt[(binNum(response, hueColorBins) + i) % n_bins] 
                    += blurFraction
              }
            }
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
          mapped.avgHueColor.push(
            d3.rgb(avgHueColor.r, avgHueColor.g, avgHueColor.b)
          );
          mapped.colorNameBinCounts.push(colorNameCnt);
          mapped.colorNameCount.push(term.values.length);
          mapped.totalCount += term.values.length
          if(blur == BLUR){
            mapped.totalCountBlur += termNameCnt
          }
          for (var i = 0; i < n_bins; i++) {
            termBinsRows.push({
              "lang": langData.key,
              "simplifiedName": term.key,
              "commonName": commonName,
              "rank": term.rank,
              "binNum": i,
              "cnt": colorNameCnt[i],
              "pCT": colorNameCnt[i] / termNameCnt
            });
          }
          terms.push({
            "simplifiedName": term.key,
            "modeBinNum": colorNameCnt.indexOf(d3.max(colorNameCnt))
          });
        });
        terms.sort((a,b) => a.modeBinNum - b.modeBinNum);
        termBinsRows.forEach( d => {
          d.pTC = d.cnt / d3.sum(termBinsRows.filter(d2 => d2.binNum === d.binNum), x => x.cnt);
        });

        // limit which languages are displayed
        if(
          (blur == BLUR ? mapped.totalCountBlur : mapped.totalCount)
           > MIN_TERMS_PER_BIN * n_bins){ 

          let lang_abv = langData.terms[0].values[0].langAbv//langData.key
          langAbvToLang[lang_abv] = langData.terms[0].values[0].lang

          // Update aggregated data
          langTermAggregated[lang_abv] = mapped;


          // update full dataset
          langTermInfo[lang_abv] = {}
          
          // sort for consistency in saving
          termBinsRows.sort((a, b) => a.simplifiedName.localeCompare(b.simplifiedName))

          for(const termBinsRow of termBinsRows){

            if(!(termBinsRow.simplifiedName in langTermInfo[lang_abv])){
              const totalTermCnt = d3.sum(termBinsRows.filter(d => d.simplifiedName === termBinsRow.simplifiedName), x => x.cnt)
              
              langTermInfo[lang_abv][termBinsRow.simplifiedName] = {
                simplifiedName: termBinsRow.simplifiedName,
                commonName: termBinsRow.commonName,
                rank: termBinsRow.rank,
                cnt: totalTermCnt,
                totalColorFraction: totalTermCnt / (blur == BLUR ? mapped.totalCountBlur : mapped.totalCount),
                bins: []
              }
              if(blur != BLUR){
                langTermInfo[lang_abv][termBinsRow.simplifiedName].cnt= totalTermCnt
              } else {
                langTermInfo[lang_abv][termBinsRow.simplifiedName].blur_cnt= totalTermCnt * mapped.totalCount /  mapped.totalCountBlur 
                langTermInfo[lang_abv][termBinsRow.simplifiedName].blur_cnt= totalTermCnt
              }
            }

            langTermInfo[lang_abv][termBinsRow.simplifiedName].bins[termBinsRow.binNum] = {
              cnt: termBinsRow.cnt,
              pCT: termBinsRow.pCT,
              pTC: termBinsRow.pTC
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


      // fill in the hue_colors_info
      for(const [lang_abv, colorData] of Object.entries(langTermAggregated)){
        const lang = langAbvToLang[lang_abv]

        if(lang_abv != "colorSet"){
          for(const [i, simplifiedName] of colorData.terms.entries()){
            // check if lang term already in hue_colors_info
            if(hue_colors_info.filter(d => d.lang == lang && d.simplifiedName == simplifiedName).length < 1){
              hue_colors_info.push({
                lang: lang,
                lang_abv: lang_abv,
                simplifiedName: simplifiedName,
                commonName: colorData.commonNames[i],
                avgHueColor: colorData.avgHueColor[i],
                cnt: colorData.colorNameCount[i]
              })
            }
          }
        }
      }
      

      // Export the data


      let blur_text = ""
      if(blur == BLUR){
        blur_text = "_blur"
      }
      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}_${O_AGGREGATE}.json`, JSON.stringify(langTermAggregated, null, 2));
      

      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}.json`, JSON.stringify(langTermInfo, null));
    }
  }

  hue_colors_info.sort((a, b) => a.lang.localeCompare(b.lang))

  // export overall color info
  let hueColorWriter = csvWriter();
  hueColorWriter.pipe(fs.createWriteStream(O_HUE_SUMMARY_FILE));
  for(const [lang, hue_color_data_row] of Object.entries(hue_colors_info)){
    hueColorWriter.write(hue_color_data_row)
  }
  hueColorWriter.end();
});



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