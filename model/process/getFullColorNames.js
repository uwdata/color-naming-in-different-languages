const fs = require('fs'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  labBinHelperLib = require('./labBinHelper');
 

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

const MIN_NperBin = 4;
const FILE_O = "../full_color_names_binned";
const FILE_O_SALIENCY = "../full_color_map_saliency_bins"

csv().fromFile("../cleaned_color_names.csv").then((colorNames)=> {
csv().fromFile("../basic_full_color_info.csv").then((colorInfo)=> {
csv().fromFile("../lang_info.csv").then((lang_info)=> {
for(let labBinSize of LAB_BIN_SIZES){
  console.log("calculating full colors for bin size " + labBinSize)

  const labBinHelper = labBinHelperLib.getLabBins(labBinSize);

  const lab_bins = JSON.parse(fs.readFileSync(`../lab_bins_${(Math.round((labBinSize + Number.EPSILON) * 100) / 100)}.json`))
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
      if(term.key == "pink"){
        debugger
      }
      for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const l = thisBin.l_bin,
              a = thisBin.a_bin,
              b = thisBin.b_bin
        
        if(l == 6 && a == 9 && b == -1){
          debugger
        }

        if (term.binColorNameCnt[l][a][b] !== 0) {
          bufFlatten.push({
            "lang": langData.key,
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


  });

  fs.writeFileSync(FILE_O + "_"+(Math.round((labBinSize + Number.EPSILON) * 100) / 100)+".json", JSON.stringify(flatten));

  fs.writeFileSync(FILE_O_SALIENCY + "_"+(Math.round((labBinSize + Number.EPSILON) * 100) / 100)+".json", JSON.stringify(saliency))
}
});
});
});

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}