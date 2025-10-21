const fs = require('fs'),
  zlib = require('zlib'),
  d3 = require('d3'),
  labBinHelper = require('../utils/labBinHelper.js').getLabBins(10)

const NO_BLUR = "no-blur"
const BLUR = "blur"

const fullBinData = {}
fullBinData[NO_BLUR] = JSON.parse(fs.readFileSync("../../model/binned_full_colors/full_color_names_binned_10.json"));
fullBinData[BLUR] = JSON.parse(
  zlib.unzipSync(
    fs.readFileSync("../../model/binned_full_colors/full_color_names_binned_blur_10.json.gz")
)); 

const BIN_NUM = 10;
const LANG_CODE = {
  'English (English)' : "en",
  'Korean (한국어, 조선어)' : "ko"
};

const schemes = [
  {
    "name": "viridis", "fn": d3.interpolateViridis, "data": []
  },
  {
    "name": "magma", "fn": d3.interpolateMagma, "data": []
  },
  {
    "name": "inferno", "fn": d3.interpolateInferno, "data": []
  },
  {
    "name": "plasma", "fn": d3.interpolatePlasma, "data": []
  }
];

for(const blur of [NO_BLUR, BLUR]){
  let result = [];
  schemes.forEach(scheme => {

    Object.keys(LANG_CODE).forEach(lang => {
      let data = [];
      for (var i = 0; i < (BIN_NUM + 1); i++) {
        let lab = d3.lab(d3.color(scheme.fn(i/BIN_NUM)));
        let [binL, binA, binB] = labBinHelper.bins_from_lab({l: lab.l, a: lab.a, b: lab.b})
        let binData = fullBinData[blur].filter(d => {
          return d.lang === lang &&
            d.binL === binL && d.binA === binA && d.binB === binB;
        });
        data = data.concat(
          binData.map(d => {
            return {
              "scheme": scheme.name,
              "lang": lang,
              "term": d.term,
              "cnt": d.cnt,
              "pTC": d.cnt / d3.sum(binData, d2 => d2.cnt),
              "binNum": i,
              "rgb": lab.rgb().toString()
            };
          })
        );
      }
      data.forEach(d => {
        d.pCT = d.cnt / d3.sum(data.filter(e => e.term === d.term), d => d.cnt);
      });
      result = result.concat(data);
    });
  });

  let blur_name = ""
  if(blur == BLUR){
    blur_name = "_blur"
  }
  fs.writeFileSync(`../../model/scheme_color_names${blur_name}.json`, JSON.stringify(result, null, 2));
}