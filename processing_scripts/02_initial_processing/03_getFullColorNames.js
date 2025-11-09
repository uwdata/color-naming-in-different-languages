const fs = require('fs'),
  csv = require("csvtojson"),
  csvWriter = require('csv-write-stream'),
  zlib = require('zlib'),
  d3 = require('d3'),
  oklab = require('../../raw/oklab.js'),
  labBinHelperLib = require('../utils/labBinHelper');
 

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

  const lab_bins = JSON.parse(fs.readFileSync(`../../model/color_info_pre_naming/lab_bins_${labBinSize}.json`))
  const lab_bins_arr = labBinHelper.labBinsToArray(lab_bins)

  

  commonColorNameLookup = {};
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
    let langBinColorHueNameCnt = labBinHelper.createLABNumBins(lab_bins);
    let langBinColorNonHueNameCnt = labBinHelper.createLABNumBins(lab_bins);
    langData.terms.forEach(term => {
      term.binColorNameCnt = labBinHelper.createLABNumBins(lab_bins)
      term.binHueNameCnt = labBinHelper.createLABNumBins(lab_bins)
      term.binNonHueNameCnt = labBinHelper.createLABNumBins(lab_bins)

      term.totalHueNameCnt = 0
      term.totalNonHueNameCnt = 0

      term.values.forEach(response => {
        let responseLab = oklab.rgbToOklab({r: response.r, g: response.g, b: response.b});
        let [l, a, b] = labBinHelper.bins_from_lab({l: responseLab.l, a: responseLab.a, b: responseLab.b});
        term.binColorNameCnt[l][a][b] += 1;
        langBinColorNameCnt[l][a][b] += 1;
        // check if hue color or non-hue color and calculate scaled counts
        if(Math.max(response.r, response.g, response.b) == 255 && Math.min(response.r, response.g, response.b) == 0){
          term.binHueNameCnt[l][a][b] += 1
          langBinColorHueNameCnt[l][a][b] += 1
          term.totalHueNameCnt += 1
        } else {
          term.binNonHueNameCnt[l][a][b] += 1
          langBinColorNonHueNameCnt[l][a][b] += 1
          term.totalNonHueNameCnt += 1
        }
      });
    });

    // go through each term and bin for term to calculate 
    // corrected term count

    let langBinColorCorrectedCnt = labBinHelper.createLABNumBins(lab_bins);
    langData.terms.forEach(term => {
       term.correctedBinCnt = labBinHelper.createLABNumBins(lab_bins)
       for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const l = thisBin.l_bin,
              a = thisBin.a_bin,
              b = thisBin.b_bin
        if (term.binColorNameCnt[l][a][b] !== 0) {
          const bin_hue_correction_multiplier = (langBinColorHueNameCnt[l][a][b] +  langBinColorNonHueNameCnt[l][a][b]) * lab_bins[l][a][b].lab_hue_color_ratio_est / langBinColorHueNameCnt[l][a][b]
          const bin_non_hue_correction_multiplier = (langBinColorHueNameCnt[l][a][b] +  langBinColorNonHueNameCnt[l][a][b]) * (1-lab_bins[l][a][b].lab_hue_color_ratio_est) / langBinColorNonHueNameCnt[l][a][b]
          term.correctedBinCnt[l][a][b] = 
            (term.binHueNameCnt[l][a][b] > 0 ? term.binHueNameCnt[l][a][b] * bin_hue_correction_multiplier : 0)
             + (term.binNonHueNameCnt[l][a][b] > 0 ? term.binNonHueNameCnt[l][a][b] * bin_non_hue_correction_multiplier : 0)
          langBinColorCorrectedCnt[l][a][b] += term.correctedBinCnt[l][a][b]
        }
      }
    })

    // we now have terms corrected cnt per bin
    // and language corrected count per bin

    // find P of term given Color now can be done by comparing
    // total bin corrected count vs term corrected count
    const global_hue_correction_multiplier = lang_info.find(d => d.lang == langData.key).hue_correction_multiplier
    const global_non_hue_correction_multiplier = lang_info.find(d => d.lang == langData.key).non_hue_correction_multiplier

    langData.terms.forEach(term => {
       term.binPCT = labBinHelper.createLABNumBins(lab_bins)
       term.binPTC = labBinHelper.createLABNumBins(lab_bins)

       for(let i = 0; i < lab_bins_arr.length; i++){
          const thisBin = lab_bins_arr[i]

          const l = thisBin.l_bin,
                a = thisBin.a_bin,
                b = thisBin.b_bin
            
          term.binPCT[l][a][b] = (term.binHueNameCnt[l][a][b]*global_hue_correction_multiplier + term.binNonHueNameCnt[l][a][b]*global_non_hue_correction_multiplier)
              / (term.totalHueNameCnt*global_hue_correction_multiplier + term.totalNonHueNameCnt*global_non_hue_correction_multiplier)// corrected count for this term *in this bin* / global corrected count for this term
          
          if(langBinColorCorrectedCnt[l][a][b] == 0 && term.correctedBinCnt[l][a][b] == 0){
            term.binPTC[l][a][b] = 0
          } else {
            term.binPTC[l][a][b] = term.correctedBinCnt[l][a][b] / langBinColorCorrectedCnt[l][a][b]
          }
       }
    })

    // Blur the pCT, pTC, and correctedBinCnt values
    langData.terms.forEach(term => {
       term.binColorNameCntBlur = labBinHelper.createLABNumBins(lab_bins)
       term.correctedBinCntBlur = labBinHelper.createLABNumBins(lab_bins)
       term.binPCTBlur = labBinHelper.createLABNumBins(lab_bins)
       term.binPTCBlur = labBinHelper.createLABNumBins(lab_bins)

       for(let i = 0; i < lab_bins_arr.length; i++){
          const thisBin = lab_bins_arr[i]

          const l = thisBin.l_bin,
                a = thisBin.a_bin,
                b = thisBin.b_bin
            
          term.binColorNameCntBlur[l][a][b] = getFieldBlur(term, l, a, b, "binColorNameCnt")
          term.correctedBinCntBlur[l][a][b] = getFieldBlur(term, l, a, b, "correctedBinCnt")
          term.binPCTBlur[l][a][b] = getFieldBlur(term, l, a, b, "binPCT")
          term.binPTCBlur[l][a][b] = getFieldBlur(term, l, a, b, "binPTC")
       }
    })

    const langTermBinsBuff = [];
    const langTermBinsBlurBuff = [];

    langData.terms.forEach(term => {
      for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const l = thisBin.l_bin,
              a = thisBin.a_bin,
              b = thisBin.b_bin

        if (term.binColorNameCnt[l][a][b] !== 0) {
          langTermBinsBuff.push({
            "lang": langData.key,
            "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
            "term": term.key,
            "commonTerm": commonColorNameLookup[langData.key][term.key],
            "binL": l,
            "binA": a,
            "binB": b,
            "cnt": term.binColorNameCnt[l][a][b],
            "correctedCnt": term.correctedBinCnt[l][a][b],
            "pCT": term.binPCT[l][a][b],
            "pTC": term.binPTC[l][a][b]
          });
        }
        if (term.binColorNameCntBlur[l][a][b] !== 0) {
          langTermBinsBlurBuff.push({
            "lang": langData.key,
            "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
            "term": term.key,
            "commonTerm": commonColorNameLookup[langData.key][term.key],
            "binL": l,
            "binA": a,
            "binB": b,
            "cnt": term.binColorNameCntBlur[l][a][b],
            "correctedCnt": term.correctedBinCntBlur[l][a][b],
            "pCT": term.binPCTBlur[l][a][b],
            "pTC": term.binPTCBlur[l][a][b]
          });
        }
      }
    })


    let bufSaliency = [];
    let bufSaliencyBlur = [];
    for(let i = 0; i < lab_bins_arr.length; i++){
      const thisBin = lab_bins_arr[i]

      const l = thisBin.l_bin,
            a = thisBin.a_bin,
            b = thisBin.b_bin
      if (langBinColorNameCnt[l][a][b] >= MIN_NperBin) {
        let maxpTC = d3.max(langTermBinsBuff.filter(d => d.binL === l && d.binA === a && d.binB === b), d => d.pTC);
        const rep_lab = lab_bins[l][a][b].representative_lab
        const majorTerm = langTermBinsBuff.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term
        const basicColorInfo = colorInfo.find((a) => a.lang == langData.key && a.simplifiedName == majorTerm)

        const topTerms = langTermBinsBuff.filter(d => d.binL === l && d.binA === a && d.binB === b)
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
          "binL": l,
          "binA": a,
          "binB": b,
          "lab": [rep_lab.l, rep_lab.a, rep_lab.b].join(","),
          "saliency": -entropy(langTermBinsBuff.filter(d => d.binL === l && d.binA === a && d.binB === b).map(d => d.pTC)),
          "maxpTC": maxpTC,
          "majorTerm": majorTerm,
          "commonTerm": commonColorNameLookup[langData.key][majorTerm],
          "avgTermColor": basicColorInfo.avgColorRGBCode,
          "topTerms": topTerms
        });
      }
      // blurred version
      if (getBlurContribution(langBinColorNameCnt,l,a,b) >= MIN_NperBin) {
        let maxpTC = d3.max(langTermBinsBlurBuff.filter(d => d.binL === l && d.binA === a && d.binB === b), d => d.pTC);
        const rep_lab = lab_bins[l][a][b].representative_lab
        const majorTerm = langTermBinsBlurBuff.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term
        const basicColorInfo = colorInfo.find((a) => a.lang == langData.key && a.simplifiedName == majorTerm)

        const topTerms = langTermBinsBlurBuff.filter(d => d.binL === l && d.binA === a && d.binB === b)
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
          "binL": l,
          "binA": a,
          "binB": b,
          "lab": [rep_lab.l, rep_lab.a, rep_lab.b].join(","),
          "saliency": -entropy(langTermBinsBlurBuff.filter(d => d.binL === l && d.binA === a && d.binB === b).map(d => d.pTC)),
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

function getBlur(binInfo, l_bin, a_bin, b_bin){
  let sumOfWeights = 0
  let weightedSum = 0
  
  for(let i of Object.keys(blurWeights)){
    i = parseInt(i)
    for(let j of Object.keys(blurWeights[i])){
      j = parseInt(j)
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        if((l_bin + i) in binInfo &&
           (a_bin + j) in binInfo[l_bin + i] &&
           (b_bin + k) in binInfo[l_bin + i][a_bin + j]
        ){
          sumOfWeights += blurWeights[i][j][k]
          weightedSum += binInfo[l_bin + i][a_bin + j][b_bin + k] * 
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
function getBlurContribution(binInfo, l_bin, a_bin, b_bin){
  let weightedSum = 0
  
  for(let i of Object.keys(blurWeights)){
    i = parseInt(i)
    for(let j of Object.keys(blurWeights[i])){
      j = parseInt(j)
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        if((l_bin + i) in binInfo &&
           (a_bin + j) in binInfo[l_bin + i] &&
           (b_bin + k) in binInfo[l_bin + i][a_bin + j]
        ){
          weightedSum += binInfo[l_bin + i][a_bin + j][b_bin + k] * 
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

function getFieldBlur(termInfo, l_bin, a_bin, b_bin, field){
  const fieldInfo = termInfo[field]
  return getBlur(fieldInfo, l_bin, a_bin, b_bin)
}