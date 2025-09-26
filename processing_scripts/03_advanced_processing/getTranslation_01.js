const fs = require('fs'),
  d3 = require('d3'),
  csv=require("csvtojson");

const LOW_RES_BIN = 20
const HIGH_RES_BIN = 10

const MIN_FRACTION_BIN_HIGH_RES = 0.4


csv().fromFile("../../model/binned_full_colors/full_color_lang_bin_info.csv")
.then((lang_bin_info)=> {

for(BIN_SIZE of [HIGH_RES_BIN, LOW_RES_BIN]){

  const labBinHelper = require('../utils/labBinHelper.js').getLabBins(BIN_SIZE);

  const lab_bins = JSON.parse(
    fs.readFileSync(`../../model/color_info_pre_naming/lab_bins_${BIN_SIZE}.json`))
  let flatData = JSON.parse(
    fs.readFileSync(`../../model/binned_full_colors/full_color_names_binned_${BIN_SIZE}.json`));

  // 1.
  if (!fs.existsSync("temp/")){
      fs.mkdirSync("temp/");
  }
  convertToMatrices(flatData, labBinHelper, lab_bins, lang_bin_info);
  fs.writeFileSync(`temp/distanceMatrix_${BIN_SIZE}.json`, JSON.stringify(getDistanceMatrix(labBinHelper, lab_bins)));
  console.log("Please run getTranslation_02_EMDparallel.py on python 2 to generate transition_loss json files.");
}

function convertToMatrices(flatData, labBinHelper, lab_bins, lang_bin_info){

  let grouped = d3.groups(flatData, d => d.lang, d => d.term)
    .map(a => {return {key: a[0], values: a[1].map(b => {return{key: b[0], values: b[1]}}) }})

  grouped.forEach(g_lang => {

    // we want to do use the high res bin, but we'll skip
    // high res bin if there is too low a fraction of bins (from not enough data)
    const langBinRatio = lang_bin_info
        .find(d=> d.lang == g_lang.key)
        [`fraction_bins_${HIGH_RES_BIN}`]
    if(langBinRatio < MIN_FRACTION_BIN_HIGH_RES
      && BIN_SIZE == HIGH_RES_BIN){
        console.log(`skipping size ${HIGH_RES_BIN} bins for lang ${g_lang.key} since it only has ${langBinRatio*100}% of bins`)
        return
    }

    let terms = [];
    
    g_lang.values = g_lang.values.sort((a,b) => d3.sum(b.values, d => d.cnt) - d3.sum(a.values, d => d.cnt));
    
    g_lang.values.forEach(g_term => {
      let labPct = labBinHelper.createLABNumBins(lab_bins);
      g_term.values.forEach(d => {
        labPct[d.binL][d.binA][d.binB] = d.pCT;
      });


      terms.push({
        "term": g_term.key,
        "lang": g_lang.key,
        "labPct": labBinHelper.labBinsToArray(labPct),
      });
    });
    const langAbv = lang_bin_info.find(d=> d.lang == g_lang.key).langAbv
    fs.writeFileSync(`temp/fullColorNames_${langAbv}_${BIN_SIZE}.json`, JSON.stringify(terms, null, 2));
  });

}

})


function getDistanceMatrix(labBinHelper, lab_bins){
  const labBinArr = labBinHelper.labBinsToArray(lab_bins)
  MSize = labBinArr.length
  let distM = new Array(MSize).fill(0);
  distM = distM.map(d => {
    return new Array(MSize).fill(0);
  });

  for (let i = 0; i < MSize; i++) {
    const [l_i, a_i, b_i] = [labBinArr[i].l_center, labBinArr[i].a_center, labBinArr[i].b_center]


    for (let j = 0; j < MSize; j++) {
      const [l_j, a_j, b_j] = [labBinArr[j].l_center, labBinArr[j].a_center, labBinArr[j].b_center]

      distM[i][j] = Math.sqrt(Math.pow(l_i - l_j,2) + Math.pow(a_i - a_j,2) + Math.pow(b_i - b_j,2));
    }
  }
  return distM;
}



