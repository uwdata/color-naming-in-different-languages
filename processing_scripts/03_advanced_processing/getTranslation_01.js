// Note: to increase Nodejs space:
//
// node --max-old-space-size=32768 .\01_createLABBins.js


import fs from 'fs'
import * as d3 from 'd3'
import zlib from 'zlib'
import csv from 'csvtojson';
import * as labBinHelperLib from '../utils/labBinHelper.js'
import BinSize from "../../shared_files/binSize.js";

const TINY_RES_BIN = new BinSize({type: "ring", l: 1/5, h_divs: 8})
const LOW_RES_BIN = new BinSize({type: "ring", l: 1/10, h_divs: 8})
const HIGH_RES_BIN =  new BinSize({type: "ring", l: 1/20, h_divs: 8})

const NO_BLUR = "no-blur"
const BLUR = "blur"

const MIN_FRACTION_BIN_HIGH_RES = 0.9

//clear tmp folder from old translations
for(const file of fs.readdirSync("temp")){
  //console.log("delete file? " + file)
  fs.rmSync("temp/"+ file)
}

for(const blur of [NO_BLUR, BLUR]){
  let blur_text = ""
  if(blur == BLUR){
    blur_text = "_blur"
  }
  const lang_bin_info = await csv({flatKeys: true}).fromFile(`../../model/binned_full_colors/full_color_lang_bin${blur_text}_info.csv`)

  for(const BIN_SIZE of [HIGH_RES_BIN, LOW_RES_BIN, TINY_RES_BIN]){

    const labBinHelper = labBinHelperLib.getLabBins(BIN_SIZE);

    let lab_bins = JSON.parse(
      fs.readFileSync(`../../model/color_info_pre_naming/oklab_bins_${BIN_SIZE.abv}.json`))
    lab_bins = lab_bins.filter((b) => b.num_rgb > 0)
    console.log("number of bins: ", lab_bins.length)
    const nested_lab_bins = labBinHelper.binsArrayToNested(lab_bins)
    let flatData
    if(blur == BLUR){
      flatData = JSON.parse(
        zlib.unzipSync(
          fs.readFileSync(`../../model/binned_full_colors/full_color_names_binned${blur_text}_${BIN_SIZE.abv}.json.gz`)));
    } else {
      flatData = JSON.parse(
        fs.readFileSync(`../../model/binned_full_colors/full_color_names_binned${blur_text}_${BIN_SIZE.abv}.json`));
    }

    // 1.
    if (!fs.existsSync("temp/")){
        fs.mkdirSync("temp/");
    }
    convertToMatrices(flatData, labBinHelper, nested_lab_bins, lang_bin_info);
    fs.writeFileSync(`temp/distanceMatrix_${BIN_SIZE.abv}.json`, JSON.stringify(getDistanceMatrix(labBinHelper, nested_lab_bins)));
    
    function convertToMatrices(flatData, labBinHelper, nested_lab_bins, lang_bin_info){

      let grouped = d3.groups(flatData, d => d.lang, d => d.term)
        .map(a => {return {key: a[0], values: a[1].map(b => {return{key: b[0], values: b[1]}}) }})

      grouped.forEach(g_lang => {

        // we want to do use the high res bin, but we'll skip
        // high res bin if there is too low a fraction of bins (from not enough data)
        const langBinRatio = lang_bin_info
            .find(d=> d.lang == g_lang.key)
            [`fraction_bins_${BIN_SIZE.abv}`]

        if(langBinRatio === undefined){
          throw new Error("Couldn't find lang info for " + g_lang.key +", " + BIN_SIZE.abv)
        }
        
        if(langBinRatio < MIN_FRACTION_BIN_HIGH_RES
          && BIN_SIZE != TINY_RES_BIN){ //always keep tiny res, even if still low percentage
            console.log(`skipping size ${BIN_SIZE.abv} ${blur} bins for lang ${g_lang.key} since it only has ${langBinRatio*100}% of bins`)
            return
        }

        let terms = [];
        
        g_lang.values = g_lang.values.sort((a,b) => d3.sum(b.values, d => d.cnt) - d3.sum(a.values, d => d.cnt));
        
        // find default values for bins (NaN if missing, 0 if present at least once)
        const langBinDefaults = labBinHelper.createLABNumBins(nested_lab_bins, NaN);
        g_lang.values.forEach(g_term => {
          g_term.values.forEach(d => {
            if(BIN_SIZE.type == "ring"){
              langBinDefaults[d.binL][d.binC][d.binH] = 0;
            } else {
              langBinDefaults[d.binL][d.binA][d.binB] = 0;
            }
          });
        });

        g_lang.values.forEach(g_term => {
          // create bin set for term with NaNs or 0s depending on what bins are missing
          let labPct = labBinHelper.createLABNumBins(nested_lab_bins, NaN);
          for(const bin1 of Object.keys(labPct)){
            for(const bin2 of Object.keys(labPct[bin1])){
              for(const bin3 of Object.keys(labPct[bin1][bin2])){
                labPct[bin1][bin2][bin3] = langBinDefaults[bin1][bin2][bin3]
              }
            }
          }

 
          g_term.values.forEach(d => {
            if(BIN_SIZE.type == "ring"){
              labPct[d.binL][d.binC][d.binH] = d.pCT;
            } else {
              labPct[d.binL][d.binA][d.binB] = d.pCT;
            }
          });


          terms.push({
            "term": g_term.key,
            "lang": g_lang.key,
            "labPct": labBinHelper.labBinsToArray(labPct),
          });
        });
        const langAbv = lang_bin_info.find(d=> d.lang == g_lang.key).langAbv
        fs.writeFileSync(`temp/fullColorNames_${langAbv}${blur_text}_${BIN_SIZE.abv}.json`, JSON.stringify(terms, null, 2));
      });
    }

  }

}


console.log("\n\n\nPlease run getTranslation_02_EMDparallel.py on python 2 to generate transition_loss json files.");

function getDistanceMatrix(labBinHelper, lab_bins){
  const labBinArr = labBinHelper.labBinsToArray(lab_bins)
  const [dim1, dim2, dim3] = labBinHelper.binSize.dims
  const MSize = labBinArr.length
  let distM = new Array(MSize).fill(0);
  distM = distM.map(d => {
    return new Array(MSize).fill(0);
  });

  for (let i = 0; i < MSize; i++) {
    const [l_center_i, a_center_i, b_center_i] = [labBinArr[i].center_lab.l, labBinArr[i].center_lab.a, labBinArr[i].center_lab.b]


    for (let j = 0; j < MSize; j++) {
      const [l_center_j, a_center_j, b_center_j] = [labBinArr[j].center_lab.l, labBinArr[j].center_lab.a, labBinArr[j].center_lab.b]

      distM[i][j] = Math.sqrt(
        Math.pow(l_center_i - l_center_j,2) 
        + Math.pow(a_center_i - a_center_j,2) 
        + Math.pow(b_center_i - b_center_j,2));
    }
  }
  return distM;
}



