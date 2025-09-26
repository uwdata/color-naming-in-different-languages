const fs = require('fs'),
  csv = require("csvtojson"),
  csvWriter = require('csv-write-stream'),
  d3 = require('d3'),
  labBinHelperLib = require('../utils/labBinHelper');
 

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES
const LAB_BIN_SIZE_ABVS = labBinHelperLib.LAB_BIN_SIZE_ABVS

// Number of colors in a bin we require to output data for that bin
const MIN_NperBin = 4;


const FILE_O = "../../model/binned_full_colors/full_color_names_binned";
const FILE_O_SALIENCY = "../../model/binned_full_colors/full_color_map_saliency_bins"
const FILE_LANG_BIN_O = "../../model/binned_full_colors/full_color_lang_bin_info.csv"


csv().fromFile("../../model/cleaned_color_names.csv").then((colorNames)=> {
csv().fromFile("../../model/full_colors_info.csv").then((colorInfo)=> {
csv().fromFile("../../model/lang_info.csv").then((lang_info)=> {

const lang_bin_info = {}

for(let labBinSize of LAB_BIN_SIZES){
  console.log("calculating full colors for bin size " + labBinSize)

  const labBinHelper = labBinHelperLib.getLabBins(labBinSize);

  const lab_bins = JSON.parse(fs.readFileSync(`../../model/color_info_pre_naming/lab_bins_${LAB_BIN_SIZE_ABVS[labBinSize]}.json`))
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


  let flatten = [], saliency = [];

  grouped_lang.forEach(langData => {
    console.log("Start : " + langData.key);

    if(!(langData.key in lang_bin_info)){
      lang_bin_info[langData.key] = {
        lang: langData.key,
        langAbv: lang_info.find(d => d.lang == langData.key).langAbv
      }
    }

    let bufFlatten = [];

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
        let responseLab = d3.lab(d3.rgb(response.r, response.g, response.b));
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
      for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const l = thisBin.l_bin,
              a = thisBin.a_bin,
              b = thisBin.b_bin
        
        if (term.binColorNameCnt[l][a][b] !== 0) {
          bufFlatten.push({
            "lang": langData.key,
            "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
            "term": term.key,
            "commonTerm": commonColorNameLookup[langData.key][term.key],
            "binL": l,
            "binA": a,
            "binB": b,
            "cnt": term.binColorNameCnt[l][a][b],
            "correctedCnt": term.correctedBinCnt[l][a][b],
            "pCT": (term.binHueNameCnt[l][a][b]*global_hue_correction_multiplier + term.binNonHueNameCnt[l][a][b]*global_non_hue_correction_multiplier)
              / (term.totalHueNameCnt*global_hue_correction_multiplier + term.totalNonHueNameCnt*global_non_hue_correction_multiplier),// corrected count for this term *in this bin* / global corrected count for this term 
            "pTC": term.correctedBinCnt[l][a][b] / langBinColorCorrectedCnt[l][a][b]
          });
        }
      }
    })


    let bufSaliency = [];
    for(let i = 0; i < lab_bins_arr.length; i++){
      const thisBin = lab_bins_arr[i]

      const l = thisBin.l_bin,
            a = thisBin.a_bin,
            b = thisBin.b_bin
      if (langBinColorNameCnt[l][a][b] >= MIN_NperBin) {
        let maxpTC = d3.max(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b), d => d.pTC);
        const rep_lab = lab_bins[l][a][b].representative_lab
        const majorTerm = bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term
        const basicColorInfo = colorInfo.find((a) => a.lang == langData.key && a.simplifiedName == majorTerm)

        bufSaliency.push({
          "lang": langData.key,
          "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
          "binL": l,
          "binA": a,
          "binB": b,
          "lab": [rep_lab.l, rep_lab.a, rep_lab.b].join(","),
          "saliency": -entropy(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b).map(d => d.pTC)),
          "maxpTC": maxpTC,
          "majorTerm": majorTerm,
          "commonTerm": commonColorNameLookup[langData.key][majorTerm],
          "avgTermColor": basicColorInfo.avgColorRGBCode
        });
      }
    }
    
    console.log("End : " + langData.key);
    saliency = saliency.concat(bufSaliency);
    flatten = flatten.concat(bufFlatten);

    lang_bin_info[langData.key][`num_bins_${LAB_BIN_SIZE_ABVS[labBinSize]}`] = bufSaliency.length
    lang_bin_info[langData.key][`fraction_bins_${LAB_BIN_SIZE_ABVS[labBinSize]}`] = bufSaliency.length / lab_bins_arr.length
  });

  fs.writeFileSync(FILE_O + "_"+LAB_BIN_SIZE_ABVS[labBinSize]+".json", JSON.stringify(flatten));

  fs.writeFileSync(FILE_O_SALIENCY + "_"+LAB_BIN_SIZE_ABVS[labBinSize]+".json", JSON.stringify(saliency))
}

let langBinInfoWriter = csvWriter();
langBinInfoWriter.pipe(fs.createWriteStream(FILE_LANG_BIN_O));
for(const [lang, lang_bin_info_entry] of Object.entries(lang_bin_info)){
  langBinInfoWriter.write(lang_bin_info_entry)
}
langBinInfoWriter.end();

});
});
});

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}