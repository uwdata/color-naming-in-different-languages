const fs = require('fs'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  labBinHelper = require('./labBinHelper.js');

const MIN_NperBin = 4;
const FILE_O = "../full_color_names.json";
const FILE_O_SALIENCY = "../full_color_map_saliency_bins.json"
const FILE_O_AVG_COLORS = "../full_color_name_avgs.json"

const lab_bins = JSON.parse(fs.readFileSync("../lab_bins.json"))
const lab_bins_arr = labBinHelper.labBinsToArray(lab_bins)

csv().fromFile("../cleaned_color_names.csv").then((colorNames)=> {
csv().fromFile("../basic_full_color_info.csv").then((colorInfo)=> {
  commonColorNameLookup = {};
  colorInfo.forEach(ci => {
		if(!commonColorNameLookup[ci.lang]){
      commonColorNameLookup[ci.lang] = [];
    }
		commonColorNameLookup[ci.lang][ci.simplifiedName] = ci.commonName;
	});

  let grouped = d3.nest()
    .key(d => d.lang0)
    .entries(colorNames)
    .sort((a,b) =>  - a.values.length + b.values.length);

  grouped.forEach(g => {
    g.terms = d3.nest()
                .key(v => v.name)
                .entries(g.values)
                .sort((a,b) => -a.values.length + b.values.length);

    g.terms = g.terms.filter(g_term => commonColorNameLookup[g.key] && commonColorNameLookup[g.key][g_term.key]);
  });

  grouped = grouped.filter(g => g.terms.length > 0);


  let flatten = [], saliency = [];

  grouped.forEach(group => {
    console.log("Start : " + group.key);

    let bufFlatten = [];

    let gColorNameCnt = labBinHelper.createLABNumBins(lab_bins);
    group.terms.forEach(term => {
      let colorNameCnt = labBinHelper.createLABNumBins(lab_bins);
      term.values.forEach(response => {
        let responseLab = d3.lab(d3.rgb(response.r, response.g, response.b));
        let [l, a, b] = labBinHelper.bins_from_lab({l: responseLab.l, a: responseLab.a, b: responseLab.b});
        colorNameCnt[l][a][b] += 1;
        gColorNameCnt[l][a][b] += 1;
      });

      for(let i = 0; i < lab_bins_arr.length; i++){
        const thisBin = lab_bins_arr[i]

        const l = thisBin.l_bin,
              a = thisBin.a_bin,
              b = thisBin.b_bin
        if (colorNameCnt[l][a][b] !== 0) {

          bufFlatten.push({
            "lang": group.key,
            "term": term.key,
            "commonTerm": commonColorNameLookup[group.key][term.key],
            "binL": l,
            "binA": a,
            "binB": b,
            "cnt": colorNameCnt[l][a][b],
            "pCT": colorNameCnt[l][a][b] / term.values.length
          });
        }
      }
    });


    bufFlatten.forEach( d => {
      d.pTC = d.cnt / gColorNameCnt[d.binL][d.binA][d.binB];
    });
    let bufSaliency = [];
    for(let i = 0; i < lab_bins_arr.length; i++){
      const thisBin = lab_bins_arr[i]

      const l = thisBin.l_bin,
            a = thisBin.a_bin,
            b = thisBin.b_bin
      if (gColorNameCnt[l][a][b] >= MIN_NperBin) {
        let maxpTC = d3.max(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b), d => d.pTC);
        const rep_lab = lab_bins[l][a][b].representative_lab
        bufSaliency.push({
          "lang": group.key,
          "binL": l,
          "binA": a,
          "binB": b,
          "lab": [rep_lab.l, rep_lab.a, rep_lab.b].join(","),
          "saliency": -entropy(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b).map(d => d.pTC)),
          "maxpTC": maxpTC,
          "majorTerm": bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term,
          "commonTerm": commonColorNameLookup[group.key][bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term]
        });
      }
    }
    
    console.log("End : " + group.key);
    saliency = saliency.concat(bufSaliency);
    flatten = flatten.concat(bufFlatten);


  });

    const avgColors = getAvgColors(flatten, unique(saliency.map(d => d.majorTerm)));

    for(let i = 0; i < saliency.length; i++){
      const saliency_info = saliency[i]
      const avgColor = avgColors.find(d => d.lang === saliency_info.lang && d.name === saliency_info.majorTerm)
      saliency_info.avgTermColor = avgColor.avgColorRGBCode
    }

  fs.writeFileSync(FILE_O, JSON.stringify(flatten));

  fs.writeFileSync(FILE_O_SALIENCY, JSON.stringify(saliency))

  fs.writeFileSync(FILE_O_AVG_COLORS, JSON.stringify(avgColors))

});
});

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}


function getAvgColors(data, clusteredTerms){
  let colorTerms = [];
  let grouped = d3.nest().key(d => d.lang).key(d => d.term).entries(data);
  grouped.forEach(g_lang => {
    let topTerms  = g_lang.values;
    if (clusteredTerms) {
      topTerms  = topTerms.filter(g_term => clusteredTerms.indexOf(g_term.key) >= 0);
    }
    let totalCount = d3.sum(topTerms, g_term => d3.sum(g_term.values, d => d.pTC));

    topTerms.forEach(g_term => {
      let cnt = d3.sum(g_term.values, d => d.pTC);
      let avgLBin = d3.sum(g_term.values, d => d.binL * d.pCT);
      let avgABin = d3.sum(g_term.values, d => d.binA * d.pCT);
      let avgBBin = d3.sum(g_term.values, d => d.binB * d.pCT);

      // Note: lab_from_bins works even if the bins are not whole numbers, as is the case here
      let [avg_l, avg_a, avg_b] = labBinHelper.lab_from_bins(avgLBin, avgABin, avgBBin)

      colorTerms.push({
        "lang": g_lang.key,
        "name": g_term.key,
        "avgLAB": {l: avg_l, a: avg_a, b: avg_b},
        "avgColorRGBCode": d3.color(d3.lab(avg_l, avg_a, avg_b)).toString(),
        "binPctCnt": cnt,
        "totalColorFraction": cnt / totalCount
      });

    });

  });
  return colorTerms;
}

function unique(arr, accessor) {
  accessor = !accessor ? (d) => { return d; } : accessor;
  return d3.nest()
    .key(accessor)
    .entries(arr)
    .map(d => d.values[0]);
}
