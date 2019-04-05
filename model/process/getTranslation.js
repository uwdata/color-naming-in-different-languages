const fs = require('fs'),
  d3 = require('d3'),
  labBinner = require('./labBinner.js');
let flatData = JSON.parse(fs.readFileSync("../full_color_names.json"));
const BIN_SIZE = 10, TOP_N = 100;
let colorNamesAbrv = {
	"English": "en",
	'Korean': "ko",
	"Persian": "fa",
	"Chinese": "zh",
	"German": "de",
	"French": "fr",
	"Portuguese": "pt",
	"Spanish": "es",
	"Swedish": "sv"
};

// 1.
if (!fs.existsSync("temp/")){
    fs.mkdirSync("temp/");
}
convertToMatrices();
fs.writeFileSync("temp/distanceMatrix.json", JSON.stringify(getDistanceMetrix()));
console.log("Please run getEMD.py on python 2 to transition_loss.json.");



function eucDist(d1, d2){
  let v1 = d1.values;
  let v2 = d2.values;
  let accessor = (d) => { return d.dist; };
  return Math.sqrt(v1.reduce((acc, v1_i, i) => {
    acc += (accessor(v1_i) - accessor(v2[i])) * (accessor(v1_i) - accessor(v2[i]));
    return acc;
  }, 0));
}

function flattenCluster(cluster, acc){
  if (cluster.left) {

    acc = flattenCluster(cluster.left, acc);
    acc = flattenCluster(cluster.right, acc);
  } else {
    acc.push(cluster.value);
  }
  return acc;
}

function convertToMatrices(){

  let grouped = d3.nest()
    .key(d => d.lang)
    .key(d => d.commonTerm)
    .entries(flatData);

  grouped.forEach(g_lang => {
    let terms = [];
    //note, this should really by on the sum of the cnt's, like below
    // actually, for som set, this should be sum of the counts of the line set (colorNames = colorNames.filter(cn => cn.rgbSet != "line"));
    //g_lang.values = g_lang.values .filter(a => a.values.length >= 15);
    
    g_lang.values = g_lang.values.sort((a,b) => d3.sum(b.values, d => d.cnt) - d3.sum(a.values, d => d.cnt));
    
    g_lang.values.forEach(g_term => {
      let labCnt = labBinner.createLABBins(BIN_SIZE);
      let labPct = labBinner.createLABBins(BIN_SIZE);
      let labPtc = labBinner.createLABBins(BIN_SIZE);
      g_term.values.forEach(d => {
        labCnt[d.binL][d.binA][d.binB] = d.cnt;
        labPct[d.binL][d.binA][d.binB] = d.pCT;
        labPtc[d.binL][d.binA][d.binB] = d.pTC;
      });


      terms.push({
        "term": g_term.key,
        "lang": g_lang.key,
        "labCnt": convertTo1D(convertTo1D(labCnt)),
        "labPct": convertTo1D(convertTo1D(labPct)),
        "labPtc": convertTo1D(convertTo1D(labPtc))
      });
    });
    fs.writeFileSync(`temp/fullColorNames_${colorNamesAbrv[g_lang.key.split("(")[0].trim()]}.json`, JSON.stringify(terms, null, 2));
  });

}
function getDistanceMetrix(){
  let [nL, nA, nB] = labBinner.createLABBinN(BIN_SIZE);
  let MSize = nL * nA * nB;
  let distM = new Array(MSize).fill(0);
  distM = distM.map(d => {
    return new Array(MSize).fill(0);
  });

  for (let i = 0; i < MSize; i++) {
    let l_i = Math.floor(i / (nA * nB));
    let a_i = Math.floor((i % (nA * nB)) / nB);
    let b_i = (i % (nA * nB)) % nB;


    for (let j = 0; j < MSize; j++) {
      let l_j = Math.floor(j / (nA * nB));
      let a_j = Math.floor((j % (nA * nB)) / nB);
      let b_j = (j % (nA * nB)) % nB;
      distM[i][j] = Math.sqrt(Math.pow(l_i - l_j,2) + Math.pow(a_i - a_j,2) + Math.pow(b_i - b_j,2));
    }
  }
  return distM;
}

function convertTo1D(arr){
  return arr.reduce((acc, curr) => {
    acc = acc.concat(curr);
    return acc;
  }, []);
}


