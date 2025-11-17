import fs from 'fs'
import Color from "colorjs.io";
import csv from 'csvtojson';
import * as d3 from 'd3'
import csvWriter from 'csv-write-stream'
import zlib from 'zlib'
import * as labBinHelperLib from '../utils/labBinHelper.js'


// const fs = require('fs'),
//   csv = require("csvtojson"),
//   csvWriter = require('csv-write-stream'),
//   zlib = require('zlib'),
//   d3 = require('d3'),
//   oklab = require('../../raw/oklab.js'),
//   labBinHelperLib = require('../utils/labBinHelper');
 

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

// Number of colors in a bin we require to output data for that bin
const MIN_NperBin = 4;


const FILE_O = "../../model/binned_full_colors/full_color_names_binned";
const FILE_O_SALIENCY = "../../model/binned_full_colors/full_color_map_saliency_bins"
const FILE_LANG_BIN_O = "../../model/binned_full_colors/full_color_lang_bin_info.csv"
const FILE_LANG_BIN_BLUR_O = "../../model/binned_full_colors/full_color_lang_bin_blur_info.csv"



csv().fromFile("../../model/cleaned_color_names.csv").then((colorNames)=> {
csv().fromFile("../../model/full_colors_info.csv").then((colorInfo)=> {
csv().fromFile("../../model/lang_info.csv").then((lang_info)=> {

const lang_bin_info = {}
const lang_bin_blur_info = {}

for(let labBinSize of LAB_BIN_SIZES){
  console.log("calculating full colors for bin size " + labBinSize)

  const labBinHelper = labBinHelperLib.getLabBins(labBinSize);

  const [dim1, dim2, dim3] = labBinSize.dims

  const [dim1BinName, dim2BinName, dim3BinName] = labBinSize.dims.map(d => "bin"+d.toUpperCase())

  // TODO: When we have full gamut data, remove the filter
  const lab_bins_arr = JSON.parse(fs.readFileSync(`../../model/color_info_pre_naming/oklab_bins_${labBinSize}.json`))
    .filter(bin => bin.num_rgb > 0 || bin.ratio_bin_in_gamut_rgb > 0)  // filter for only the rgb bins while we only have rgb data

  const lab_bins = labBinHelper.binsArrayToNested(lab_bins_arr)
  

  const commonColorNameLookup = {};
  colorInfo.forEach(ci => {
		if(!commonColorNameLookup[ci.lang]){
      commonColorNameLookup[ci.lang] = [];
    }
		commonColorNameLookup[ci.lang][ci.simplifiedName] = ci.commonName;
	});

  let grouped_lang = d3.groups(colorNames, d => d.lang0)
     .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) =>  - a.values.length + b.values.length);

  grouped_lang.forEach(langData => {
    langData.terms = d3.groups(langData.values, v => v.name)
                .map(a => {return {key: a[0], values: a[1]}})
                .sort((a,b) => -a.values.length + b.values.length);

    langData.terms = langData.terms.filter(g_term => commonColorNameLookup[langData.key] && commonColorNameLookup[langData.key][g_term.key]);
  });

  grouped_lang = grouped_lang.filter(g => g.terms.length > 0);


  let flatten = [], saliency = [],
      flattenBlur = [], saliencyBlur = [];

  grouped_lang.forEach(langData => {
    console.log("Start : " + langData.key);

    if(!(langData.key in lang_bin_info)){
      lang_bin_info[langData.key] = {
        lang: langData.key,
        langAbv: lang_info.find(d => d.lang == langData.key).langAbv
      }
      lang_bin_blur_info[langData.key] = {
        lang: langData.key,
        langAbv: lang_info.find(d => d.lang == langData.key).langAbv
      }
    }

    let langBinColorNameCnt = labBinHelper.createLABNumBins(lab_bins);
    langData.terms.forEach(term => {
      term.binColorNameCnt = labBinHelper.createLABNumBins(lab_bins)
      term.totalColorNameCnt = 0
      

      term.values.forEach(response => {
        const responseColor = new Color({
                space: "srgb", coords: [response.r/255, response.g/255, response.b/255]
              })
        
        let dim1Bin, dim2Bin, dim3Bin
        if(labBinSize.type == "ring"){
          const responseOklch = responseColor.to("oklch");
          [dim1Bin, dim2Bin, dim3Bin] = labBinHelper.bins_from_lch({l: responseOklch.l, c: responseOklch.c, h: responseOklch.h})
        } else {
          const responseOklab = responseColor.to("oklab");
          [dim1Bin, dim2Bin, dim3Bin] = labBinHelper.bins_from_lab({l: responseOklab.l, a: responseOklab.a, b: responseOklab.b}) 
        }

        term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] += 1;
        langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] += 1;
        term.totalColorNameCnt += 1
      });
    });

   

    // find P of term given Color
    langData.terms.forEach(term => {
       term.binPCT = labBinHelper.createLABNumBins(lab_bins)
       term.binPTC = labBinHelper.createLABNumBins(lab_bins)

       for(let i = 0; i < lab_bins_arr.length; i++){
          const thisBin = lab_bins_arr[i]

          const dim1Bin = thisBin[dim1 + "_bin"],
                dim2Bin = thisBin[dim2 + "_bin"],
                dim3Bin = thisBin[dim3 + "_bin"]
            
          term.binPCT[dim1Bin][dim2Bin][dim3Bin] = term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] / term.totalColorNameCnt
          
          if(langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] == 0 && term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] == 0){
            term.binPTC[dim1Bin][dim2Bin][dim3Bin] = 0
          } else {
            term.binPTC[dim1Bin][dim2Bin][dim3Bin] = term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] / langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin]
          }
       }
    })

    // Blur the pCT, pTC, values
    langData.terms.forEach(term => {
       term.binColorNameCntBlur = labBinHelper.createLABNumBins(lab_bins)
       term.binPCTBlur = labBinHelper.createLABNumBins(lab_bins)
       term.binPTCBlur = labBinHelper.createLABNumBins(lab_bins)

       for(let i = 0; i < lab_bins_arr.length; i++){
          const thisBin = lab_bins_arr[i]

          const dim1Bin = thisBin[dim1 + "_bin"],
                dim2Bin = thisBin[dim2 + "_bin"],
                dim3Bin = thisBin[dim3 + "_bin"]
            
          term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] = getFieldBlur(term, dim1Bin, dim2Bin, dim3Bin, "binColorNameCnt")
          term.binPCTBlur[dim1Bin][dim2Bin][dim3Bin] = getFieldBlur(term, dim1Bin, dim2Bin, dim3Bin, "binPCT")
          term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin] = getFieldBlur(term, dim1Bin, dim2Bin, dim3Bin, "binPTC")
       }
    })

    const langTermBinsBuff = [];
    const langTermBinsBlurBuff = [];

    langData.terms.forEach(term => {
      for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const dim1Bin = thisBin[dim1 + "_bin"],
              dim2Bin = thisBin[dim2 + "_bin"],
              dim3Bin = thisBin[dim3 + "_bin"]

        if (term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] !== 0) {
          langTermBinsBuff.push({
            "lang": langData.key,
            "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
            "term": term.key,
            "commonTerm": commonColorNameLookup[langData.key][term.key],
            [dim1BinName]: dim1Bin,
            [dim2BinName]: dim2Bin,
            [dim3BinName]: dim3Bin,
            "cnt": term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin],
            "pCT": term.binPCT[dim1Bin][dim2Bin][dim3Bin],
            "pTC": term.binPTC[dim1Bin][dim2Bin][dim3Bin]
          });
        }
        if (term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] !== 0) {
          langTermBinsBlurBuff.push({
            "lang": langData.key,
            "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
            "term": term.key,
            "commonTerm": commonColorNameLookup[langData.key][term.key],
            [dim1BinName]: dim1Bin,
            [dim2BinName]: dim2Bin,
            [dim3BinName]: dim3Bin,
            "cnt": term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin],
            "pCT": term.binPCTBlur[dim1Bin][dim2Bin][dim3Bin],
            "pTC": term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin]
          });
        }
      }
    })


    let bufSaliency = [];
    let bufSaliencyBlur = [];
    for(let i = 0; i < lab_bins_arr.length; i++){
      const thisBin = lab_bins_arr[i]

      const dim1Bin = thisBin[dim1 + "_bin"],
            dim2Bin = thisBin[dim2 + "_bin"],
            dim3Bin = thisBin[dim3 + "_bin"]
      if (langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin) {
        let maxpTC = d3.max(langTermBinsBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin), d => d.pTC);
        const rep_lab = "representative_lab" in lab_bins[dim1Bin][dim2Bin][dim3Bin] ? 
            lab_bins[dim1Bin][dim2Bin][dim3Bin].representative_lab
          :
            lab_bins[dim1Bin][dim2Bin][dim3Bin].center_lab
        
        const majorTerm = langTermBinsBuff.find(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin && d.pTC === maxpTC ).term
        const basicColorInfo = colorInfo.find((a) => a.lang == langData.key && a.simplifiedName == majorTerm)

        const topTerms = langTermBinsBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin)
                          .sort((a, b) => b.pTC - a.pTC)
                          .slice(0, 4)
                          .map(d => {return {
                            term: d.term, 
                            commonTerm: commonColorNameLookup[langData.key][d.term], 
                            pTC: d.pTC
                          }})

        bufSaliency.push({
          "lang": langData.key,
          "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
          [dim1BinName]: dim1Bin,
          [dim2BinName]: dim2Bin,
          [dim3BinName]: dim3Bin,
          "lab": [rep_lab[dim1], rep_lab[dim2], rep_lab[dim3]].join(","),
          "saliency": -entropy(langTermBinsBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin).map(d => d.pTC)),
          "maxpTC": maxpTC,
          "majorTerm": majorTerm,
          "commonTerm": commonColorNameLookup[langData.key][majorTerm],
          "avgTermColor": basicColorInfo.avgColorRGBCode,
          "topTerms": topTerms
        });
      }
      // blurred version
      if (getBlurContribution(langBinColorNameCnt,dim1Bin,dim2Bin,dim3Bin) >= MIN_NperBin) {
        let maxpTC = d3.max(langTermBinsBlurBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin), d => d.pTC);
        const rep_lab = "representative_lab" in lab_bins[dim1Bin][dim2Bin][dim3Bin] ? 
            lab_bins[dim1Bin][dim2Bin][dim3Bin].representative_lab
          :
            lab_bins[dim1Bin][dim2Bin][dim3Bin].center_lab

        if(!langTermBinsBlurBuff.find(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin && d.pTC === maxpTC )){
          console.log("Error!")
        }
        const majorTerm = langTermBinsBlurBuff.find(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin && d.pTC === maxpTC ).term
        const basicColorInfo = colorInfo.find((a) => a.lang == langData.key && a.simplifiedName == majorTerm)

        const topTerms = langTermBinsBlurBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin)
                          .sort((a, b) => b.pTC - a.pTC)
                          .slice(0, 4)
                          .map(d => {return {
                            term: d.term, 
                            commonTerm: commonColorNameLookup[langData.key][d.term], 
                            pTC: d.pTC
                          }})

        bufSaliencyBlur.push({
          "lang": langData.key,
          "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
          [dim1BinName]: dim1Bin,
          [dim2BinName]: dim2Bin,
          [dim3BinName]: dim3Bin,
          "lab": [rep_lab.dim1, rep_lab.dim2, rep_lab.dim3].join(","),
          "saliency": -entropy(langTermBinsBlurBuff.filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin).map(d => d.pTC)),
          "maxpTC": maxpTC,
          "majorTerm": majorTerm,
          "commonTerm": commonColorNameLookup[langData.key][majorTerm],
          "avgTermColor": basicColorInfo.avgColorRGBCode,
          "topTerms": topTerms
        });
      }
    }
    
    console.log("End : " + langData.key);
    saliency = saliency.concat(bufSaliency);
    flatten = flatten.concat(langTermBinsBuff);
    saliencyBlur = saliencyBlur.concat(bufSaliencyBlur);
    flattenBlur = flattenBlur.concat(langTermBinsBlurBuff);

    lang_bin_info[langData.key][`num_bins_${labBinSize}`] = bufSaliency.length
    lang_bin_info[langData.key][`fraction_bins_${labBinSize}`] = bufSaliency.length / lab_bins_arr.length
    lang_bin_blur_info[langData.key][`num_bins_${labBinSize}`] = bufSaliencyBlur.length
    lang_bin_blur_info[langData.key][`fraction_bins_${labBinSize}`] = bufSaliencyBlur.length / lab_bins_arr.length
    
  });

  fs.writeFileSync(FILE_O + "_"+labBinSize+".json", JSON.stringify(flatten));
  
  // gzip these files since they are getting very large
  fs.writeFileSync(
    FILE_O + "_blur_"+labBinSize+".json.gz", 
    zlib.gzipSync(Buffer.from(JSON.stringify(flattenBlur), 'utf-8')))


  fs.writeFileSync(FILE_O_SALIENCY + "_"+labBinSize+".json", JSON.stringify(saliency))
  fs.writeFileSync(FILE_O_SALIENCY + "_blur_"+labBinSize+".json", JSON.stringify(saliencyBlur))
}

let langBinInfoWriter = csvWriter();
langBinInfoWriter.pipe(fs.createWriteStream(FILE_LANG_BIN_O));
for(const [lang, lang_bin_info_entry] of Object.entries(lang_bin_info)){
  langBinInfoWriter.write(lang_bin_info_entry)
}
langBinInfoWriter.end();

let langBinBlurInfoWriter = csvWriter();
langBinBlurInfoWriter.pipe(fs.createWriteStream(FILE_LANG_BIN_BLUR_O));
for(const [lang, lang_bin_blur_info_entry] of Object.entries(lang_bin_blur_info)){
  langBinBlurInfoWriter.write(lang_bin_blur_info_entry)
}
langBinBlurInfoWriter.end();


});
});
});

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}


// Guassian blur truncated to a 3x3x3 grid
// NOTE: we make sure the center node is weight 1

//TODO: This currently assumes bins are uniform cubes
//    and makes center node weight 1, one dimension off, 1/8th
// For rectangular bins, the blur should be different by dimension
// and for the ring bins, figuring out the neighboring bins
//   isn't straightforward, and the distances will vary

const blurWeights = {}
for(let i of [-1,0,1]){
  blurWeights[i] = {}
  for(let j of [-1,0,1]){
    blurWeights[i][j] = {}
    for(let k of [-1,0,1]){
      blurWeights[i][j][k] = Math.pow(2, (-3 * Math.sqrt(i*i + j*j + k*k)))
    }
  }
}

function getBlur(binInfo, dim1Bin, dim2Bin, dim3Bin){
  let sumOfWeights = 0
  let weightedSum = 0
  
  for(let i of Object.keys(blurWeights)){
    i = parseInt(i)
    for(let j of Object.keys(blurWeights[i])){
      j = parseInt(j)
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        if((dim1Bin + i) in binInfo &&
           (dim2Bin + j) in binInfo[dim1Bin + i] &&
           (dim3Bin + k) in binInfo[dim1Bin + i][dim2Bin + j]
        ){
          sumOfWeights += blurWeights[i][j][k]
          weightedSum += binInfo[dim1Bin + i][dim2Bin + j][dim3Bin + k] * 
                          blurWeights[i][j][k] 
        }
      }
    }
  }
  if(weightedSum == 0){
    return 0
  }
  return weightedSum / sumOfWeights
}

// assumes the center node is weight 1
function getBlurContribution(binInfo, dim1Bin, dim2Bin, dim3Bin){
  let weightedSum = 0
  
  for(let i of Object.keys(blurWeights)){
    i = parseInt(i)
    for(let j of Object.keys(blurWeights[i])){
      j = parseInt(j)
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        if((dim1Bin + i) in binInfo &&
           (dim2Bin + j) in binInfo[dim1Bin + i] &&
           (dim3Bin + k) in binInfo[dim1Bin + i][dim2Bin + j]
        ){
          weightedSum += binInfo[dim1Bin + i][dim2Bin + j][dim3Bin + k] * 
                          blurWeights[i][j][k] 
        }
      }
    }
  }
  if(weightedSum == 0){
    return 0
  }
  return weightedSum
}

function getFieldBlur(termInfo, dim1Bin, dim2Bin, dim3Bin, field){
  const fieldInfo = termInfo[field]
  return getBlur(fieldInfo, dim1Bin, dim2Bin, dim3Bin)
}