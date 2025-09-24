const fs = require('fs'),
  d3 = require('d3'),
  labBinHelper = require('./labBinHelper.js').getLabBins(10);

const lab_bins = JSON.parse(fs.readFileSync("../lab_bins.json"))
let flatData = JSON.parse(fs.readFileSync("../full_color_names_binned.json"));
let colorNamesAbrv = {
	"English": "en",
	'Korean': "ko",
	"Persian": "fa",
	"Chinese": "zh",
	"German": "de",
	"French": "fr",
	"Portuguese": "pt",
	"Spanish": "es",
	"Swedish": "sv",	
  "Russian": "ru",
	"Dutch": "nl",
	"Polish": "pl",
	"Finnish": "fi",
	"Romanian": "ro"
};

// 1.
if (!fs.existsSync("temp/")){
    fs.mkdirSync("temp/");
}
convertToMatrices();
fs.writeFileSync("temp/distanceMatrix.json", JSON.stringify(getDistanceMatrix()));
console.log("Please run getTranslation_02_EMDparallel.py on python 2 to generate transition_loss json files.");


function convertToMatrices(){

  let grouped = d3.groups(flatData, d => d.lang, d => d.term)
    .map(a => {return {key: a[0], values: a[1].map(b => {return{key: b[0], values: b[1]}}) }})

  grouped.forEach(g_lang => {
    let terms = [];
    //note, this should really by on the sum of the cnt's, like below
    // actually, for som set, this should be sum of the counts of the line set (colorNames = colorNames.filter(cn => cn.rgbSet != "line"));
    //g_lang.values = g_lang.values .filter(a => a.values.length >= 15);
    
    g_lang.values = g_lang.values.sort((a,b) => d3.sum(b.values, d => d.cnt) - d3.sum(a.values, d => d.cnt));
    
    g_lang.values.forEach(g_term => {
      let labCnt = labBinHelper.createLABNumBins(lab_bins);
      let labPct = labBinHelper.createLABNumBins(lab_bins);
      let labPtc = labBinHelper.createLABNumBins(lab_bins);
      g_term.values.forEach(d => {
        labCnt[d.binL][d.binA][d.binB] = d.cnt;
        labPct[d.binL][d.binA][d.binB] = d.pCT;
        labPtc[d.binL][d.binA][d.binB] = d.pTC;
      });


      terms.push({
        "term": g_term.key,
        "lang": g_lang.key,
        "labCnt": labBinHelper.labBinsToArray(labCnt),
        "labPct": labBinHelper.labBinsToArray(labPct),
        "labPtc": labBinHelper.labBinsToArray(labPtc)
      });
    });
    fs.writeFileSync(`temp/fullColorNames_${colorNamesAbrv[g_lang.key.split("(")[0].trim()]}.json`, JSON.stringify(terms, null, 2));
  });

}
function getDistanceMatrix(){
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



