const fs = require('fs'),
  colorBins = require('../utils/hueColorBins.js'),
  languages_iso_639 = require("../../raw/languages-iso-639.js").languages_iso_639,
  csv = require("csvtojson"),
  csvWriter = require('csv-write-stream'),
  d3 = require('d3');


const N_BIN_OPTIONS = [72, 36]

// fraction of colors needed to include this color
const MIN_COLOR_FRACTION = .002 

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



csv()
.fromFile(I_FILE)
.then((colorNames)=>{
  hue_colors_info = []

  for(const blur of [NO_BLUR, BLUR]){
    for(const n_bins of N_BIN_OPTIONS){
      console.log("Calculating bins", n_bins, blur)
      //There is a possible priming effect for studies with version 1.1.4, but we'll ignore that for now
      // We also won't remove participants who got assigned id of 0 due to a bug (as we had previously done)
      //colorNames = colorNames.filter(cn => cn.participantId != 0);
      colorNames = colorNames.filter(cn => cn.rgbSet === "line");


      // 1. Get top languages
      let groupedByLang = d3.groups(colorNames, d => d.lang0)
        .map(a => {return {key: a[0], values: a[1]}})
        .sort((a,b) =>  - a.values.length + b.values.length)
        

      // 2. Get top terms
      groupedByLang.forEach((lang) => {
        lang.terms = d3.groups(lang.values, v => v.name)
          .map(a => {return {key: a[0], values: a[1]}})
          .sort((a,b) => -a.values.length + b.values.length);

        let rankLookUp = lang.terms.map(t => t.values.length);
        //lang.topNTerms = lang.terms.filter(t => rankLookUp.indexOf(t.values.length) + 1 <= N_TERMS);
        lang.topNTerms = lang.terms
          .filter(t => t.values.length >= MIN_ENTRIES_PER_TERM)
          .filter(t => t.values.length / lang.values.length > MIN_COLOR_FRACTION);

        lang.terms.forEach(t => {
          t.rank = rankLookUp.indexOf(t.values.length) + 1;
        });


        //Print out the terms
        //console.log(`Lang : ${lang.key}`);

        //console.log(`Terms : ${JSON.stringify(lang.topNTerms.map(subg => subg.key))}`);

      });



      // 3. Group the data into bins
      let bin = colorBins.genBin(n_bins);
      let result = {};
      let flatten = [];

      groupedByLang.forEach(lang => {
        let bufFlatten = [];
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
        lang.topNTerms.forEach(term => {
          mapped.terms.push(term.key);

          //find most common name for term
          let commonName = term.values[0].standardized_entered_name
          mapped.commonNames.push(commonName)
          
          let colorNameCnt = new Array(n_bins).fill(0);
          let termNameCnt = 0
          let [x_hue_angle, y_hue_angle] = [0, 0]

          // make sure all values are actually hue colors (some got mislabeled)
          term.values = term.values.filter((response) => Math.max(response.r, response.g, response.b) == 255 && Math.min(response.r, response.g, response.b) == 0)

          term.values.forEach(response => {
            if(blur == NO_BLUR){
              colorNameCnt[colorBins.binNum(response, bin)] += 1;
              termNameCnt += 1
            } else { //blur
              // allow blur to go two to the side
              for(let i = -2; i <= 2; i++){
                const blurFraction = Math.pow(2, - BLUR_EXPONENT * Math.abs(i))
                termNameCnt += blurFraction
                colorNameCnt[(colorBins.binNum(response, bin) + i) % n_bins] 
                    += blurFraction
              }
            }
            const colorHueRatio = colorBins.getHueColorRatio(response)
            x_hue_angle += Math.cos(colorHueRatio * 2*Math.PI),
            y_hue_angle += Math.sin(colorHueRatio * 2*Math.PI)
          });
          let angle = Math.atan(y_hue_angle / x_hue_angle)
          if(x_hue_angle < 0){
            angle += Math.PI 
          } else if (y_hue_angle < 0){
            angle += 2 * Math.PI
          } 
          const avgHueColor = colorBins.getHueColorFromRatio(angle / (2*Math.PI))
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
            bufFlatten.push({
              "lang": lang.key,
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
        bufFlatten.forEach( d => {
          d.termSubID = terms.findIndex(t => t.simplifiedName === d.simplifiedName);
          d.pTC = d.cnt / d3.sum(bufFlatten.filter(d2 => d2.binNum === d.binNum), x => x.cnt);
        });

        // limit which languages are displayed
        if(
          (blur == BLUR ? mapped.totalCountBlur : mapped.totalCount)
           > MIN_TERMS_PER_BIN * n_bins){ 
          flatten = flatten.concat(bufFlatten);
          result[lang.key] = mapped;
        }
      });


      result.colorSet = bin.map(function(index, i, array){
        // get the midpoint hue color in the bin to represent the bin
        return colorBins.colorSet[Math.round(i===0 ? index/2 : (index + array[i-1]) / 2)];
      });


      // fill in the hue_colors_info
      for(const [lang, colorData] of Object.entries(result)){
        let lang_abv 
        const langMatch = languages_iso_639.find(l => `${l["Language name"]} (${l["Native name"]})` == lang)
        if(langMatch){
          lang_abv = langMatch["639‑1"]
        }

        if(lang != "colorSet"){
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
      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}_${O_AGGREGATE}.json`, JSON.stringify(result, null, 2));
      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}.json`, JSON.stringify(flatten, null, 2));
    }
  }

  // export overall color info
  let hueColorWriter = csvWriter();
  hueColorWriter.pipe(fs.createWriteStream(O_HUE_SUMMARY_FILE));
  for(const [lang, hue_color_data_row] of Object.entries(hue_colors_info)){
    hueColorWriter.write(hue_color_data_row)
  }
  hueColorWriter.end();
});
