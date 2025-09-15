const fs = require('fs'),
  d3 = require('d3'),
  labBinHelper = require('./labBinHelper.js')
let flatData = JSON.parse(fs.readFileSync("../full_color_names_binned.json"));
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

let result = [];
schemes.forEach(scheme => {

  Object.keys(LANG_CODE).forEach(lang => {
    let data = [];
    let previous = {};
    for (var i = 0; i < (BIN_NUM + 1); i++) {
      let lab = d3.lab(d3.color(scheme.fn(i/BIN_NUM)));
      let [binL, binA, binB] = labBinHelper.bins_from_lab({l: lab.l, a: lab.a, b: lab.b})
      let binData = flatData.filter(d => {
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


fs.writeFileSync("../scheme_color_names.json", JSON.stringify(result, null, 2));