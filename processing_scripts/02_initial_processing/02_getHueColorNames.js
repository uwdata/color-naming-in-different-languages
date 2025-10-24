const fs = require('fs'),
  colorBins = require('../utils/hueColorBins.js'),
  csv = require("csvtojson"),
  d3 = require('d3');
//const converter = new Converter({});



N_BIN_OPTIONS = [36, 72]

// fraction of colors needed to include this color
MIN_COLOR_FRACTION = .005 

// Restrict languages to those that have a minimum number of terms per bin
//  (note: blur allows more languages to be included)
MIN_TERMS_PER_BIN = 16 
const NO_BLUR = "no-blur"
const BLUR = "blur"
const BLUR_EXPONENT = 1.5

const O_FILE_NAME = `../../model/binned_hue_colors/hue_color_names_binned_`;
const O_AGGREGATE = `aggregated`;

csv()
.fromFile("../../model/cleaned_color_names.csv")
.then((colorNames)=>{
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
        lang.topNTerms = lang.terms.filter(t => t.values.length / lang.values.length > MIN_COLOR_FRACTION);

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
          'colorNameCount': [],
          'terms': [],
          'commonNames': [],
          'totalCount' : 0,
          'avgColor': []
        }
        if(blur == BLUR){
          mapped.totalCountBlur = 0
        }
        lang.topNTerms.forEach(term => {
          mapped.terms.push(term.key);

          //find most common name for term
          let commonName = d3.groups(term.values, t => t.standardized_entered_name)
              .map(a => {return {key: a[0], values: a[1]}})
              .sort((a,b) => -a.values.length + b.values.length)[0]
              .key
          mapped.commonNames.push(commonName)
          
          let colorNameCnt = new Array(n_bins).fill(0);
          let termNameCnt = 0
          let [l, a, b] = [0, 0, 0];
          term.values.forEach(response => {
            if(blur == NO_BLUR){
              colorNameCnt[colorBins.binNum(response, bin)] += 1;
              termNameCnt += 1
            } else { //blur
              // allow blur to go two to the side
              for(let i = -2; i <= 2; i++){
                const blurFraction = Math.pow(2, - BLUR_EXPONENT * Math.abs(i))
                termNameCnt += blurFraction
                colorNameCnt[colorBins.binNum(response, bin) + i % n_bins] 
                    += blurFraction
              }
            }
            let lab = d3.lab(d3.color(`rgb(${[response.r, response.g, response.b].map(Math.floor).join(",")})`));
            l += lab.l;
            a += lab.a;
            b += lab.b;
          });
          let avgLABColor = d3.lab(l/term.values.length, a/term.values.length, b/term.values.length);
          let avgRGBColor = d3.color(avgLABColor);
          mapped.avgColor.push({
            "r": avgRGBColor.r, "g": avgRGBColor.g, "b": avgRGBColor.b
          });
          mapped.colorNameCount.push(colorNameCnt);
          mapped.totalCount += term.values.length
          if(blur == BLUR){
            mapped.totalCountBlur += termNameCnt
          }
          //totalTermPCT = d3.sum(colorNameCnt) / termNameCnt
          if(mapped.totalCount > 10 ){
            for (var i = 0; i < n_bins; i++) {
              bufFlatten.push({
                "lang": lang.key,
                "term": term.key,
                "commonName": commonName,
                "rank": term.rank,
                "binNum": i,
                "cnt": colorNameCnt[i],
                "pCT": colorNameCnt[i] / termNameCnt
              });
            }
            terms.push({
              "term": term.key,
              "modeBinNum": colorNameCnt.indexOf(d3.max(colorNameCnt))
            });
          }
        });
        terms.sort((a,b) => a.modeBinNum - b.modeBinNum);
        bufFlatten.forEach( d => {
          d.termSubID = terms.findIndex(t => t.term === d.term);
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

      // Export the data

      let blur_text = ""
      if(blur == BLUR){
        blur_text = "_blur"
      }
      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}_${O_AGGREGATE}.json`, JSON.stringify(result, null, 2));
      fs.writeFileSync(`${O_FILE_NAME}${n_bins}${blur_text}.json`, JSON.stringify(flatten, null, 2));
    }
  }
});

