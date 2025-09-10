const fs = require('fs'),
  refine = require('./refine.js'),
  csv = require("csvtojson"),
  Converter = require("csvtojson").Converter,
  d3 = require('d3'),
  labBinner = require('./labBinner');
const converter = new Converter({});
const BIN_SIZE = 10;
const RGB_SET = "all";
const MIN_NperTerm = 2;
const MIN_NperBin = 4;
const FILE_O = "../full_color_names.json";
const FILE_O_VIS = "../full_color_map.vl.json";
const FILE_O_VIS_SALIENCY = "../full_color_map_sal.vl.json";

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


  let result = {};
  let flatten = [], saliency = [];
  let [N_L, N_A, N_B] = labBinner.createLABBinN(BIN_SIZE);

  grouped.forEach(group => {
    console.log("Start : " + group.key);

    let bufFlatten = [];

    let gColorNameCnt = labBinner.createLABBins(BIN_SIZE);
    group.terms.forEach(term => {
      let colorNameCnt = labBinner.createLABBins(BIN_SIZE);
      term.values.forEach(response => {
        let responseLab = d3.lab(d3.rgb(response.r, response.g, response.b));
        let [l, a, b] = labBinner.getLABBinNum(responseLab.l, responseLab.a, responseLab.b);
        colorNameCnt[l][a][b] += 1;
        gColorNameCnt[l][a][b] += 1;
      });

      for (let l = 0; l < N_L; l++) {
        for (let a = 0; a < N_A; a++) {
          for (let b = 0; b < N_B; b++) {
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
        }
      }
    });


    bufFlatten.forEach( d => {
      d.pTC = d.cnt / gColorNameCnt[d.binL][d.binA][d.binB];
    });
    let bufSaliency = [];
    for (let l = 0; l < N_L; l++) {
      for (let a = 0; a < N_A; a++) {
        for (let b = 0; b < N_B; b++) {

          if (gColorNameCnt[l][a][b] >= MIN_NperBin) {
            let maxpTC = d3.max(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b), d => d.pTC);
            bufSaliency.push({
              "lang": group.key,
              "binL": l,
              "binA": a,
              "binB": b,
              "lab": labBinner.getLAB(l, a, b).join(","),
              "saliency": -entropy(bufFlatten.filter(d => d.binL === l && d.binA === a && d.binB === b).map(d => d.pTC)),
              "maxpTC": maxpTC,
              "majorTerm": bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term,
              "commonTerm": commonColorNameLookup[group.key][bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term]
            });
          }

        }
      }
    }


    console.log("End : " + group.key);
    saliency = saliency.concat(bufSaliency);
    flatten = flatten.concat(bufFlatten);


  });



  fs.writeFileSync(FILE_O, JSON.stringify(flatten));

  let saliencyRange = d3.extent(saliency, d => d.saliency);
  vlSpec.transform[2] = {"calculate": `datum.saliency + ${-saliencyRange[0]}`, "as": "sal"};
  vlSpec.data = { "values": saliency };

  let avgColors = getAvgColors(flatten, unique(saliency.map(d => d.majorTerm)));
  let modalColor = getModalColors(flatten, unique(saliency.map(d => d.majorTerm)));

  vlSpec.spec.layer[0].encoding.color.scale = {
    "domain": avgColors.map(c => c.name + "-" + c.lang),
    "range": avgColors.map(c => c.avgColorRGBCode)
  };
  // vlSpec.spec.layer[0].encoding.color.scale = {
  //   "domain": modalColor.map(c => c.name),
  //   "range": modalColor.map(c => c.modalColorRGBCode)
  // };

  fs.writeFileSync(FILE_O_VIS, JSON.stringify(vlSpec, null, 2));
  vlSpec.spec.layer[0].encoding.size.field = "sal";
  fs.writeFileSync(FILE_O_VIS_SALIENCY, JSON.stringify(vlSpec, null, 2));
});
});

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}


function getModalColors(data, clusteredTerms){
  let colorTerms = [];
  let grouped = d3.nest().key(d => d.lang).key(d => d.term).entries(data);
  grouped.forEach(g_lang => {
    let topTerms  = g_lang.values;
    if (clusteredTerms) {
      topTerms  = topTerms.filter(g_term => clusteredTerms.indexOf(g_term.key) >= 0);
    }

    topTerms.forEach(g_term => {
      let mode = d3.max(g_term.values, d => d.pCT);
      let modalColor = g_term.values.find(d => d.pCT === mode);

      colorTerms.push({
        "lang": g_lang.key,
        "name": g_term.key,
        "modalColorRGBCode": d3.color(d3.lab(...labBinner.getLAB(modalColor.binL, modalColor.binA, modalColor.binB))).toString()
      });

    });

  });
  return colorTerms;
}


function getAvgColors(data, clusteredTerms){
  let colorTerms = [];
  let grouped = d3.nest().key(d => d.lang).key(d => d.term).entries(data);
  grouped.forEach(g_lang => {
    let topTerms  = g_lang.values;
    if (clusteredTerms) {
      topTerms  = topTerms.filter(g_term => clusteredTerms.indexOf(g_term.key) >= 0);
    }

    topTerms.forEach(g_term => {
      let cnt = d3.sum(g_term.values, d => d.pTC);
      let avgL = d3.sum(g_term.values, d => d.binL * d.pCT);
      let avgA = d3.sum(g_term.values, d => d.binA * d.pCT);
      let avgB = d3.sum(g_term.values, d => d.binB * d.pCT);

      colorTerms.push({
        "lang": g_lang.key,
        "name": g_term.key,
        "avgColorRGBCode": d3.color(d3.lab(...labBinner.getLAB(avgL, avgA, avgB))).toString()
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

let vlSpec = {

  "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
  "transform": [
    {
      "calculate": "datum.binA + -8",
      "as": "binA2"
    },
    {
      "calculate": "datum.binB + -12",
      "as": "binB2"
    },
    {
      "calculate": "5 + datum.saliency",
      "as": "sal"
    },
    {
      "calculate": "datum.majorTerm +'-' + datum.lang",
      "as": "majorTermLang"
    },
    {"filter": {"field": "lang", "oneOf": ["English (English)", "Korean (한국어, 조선어)"]}}
  ],
  "config":{
    "view": {"stroke": null},
    "background": "#fff"
  },
  "facet": {
    "row": {
      "field": "lang",
      "type": "ordinal",
      "header": {"title": null}
    },
    "column": {
      "field": "binL",
      "type": "ordinal",
      "header": {"title": null}
    }
  },
  "spacing": {"row": -20, "column": -20},
  "spec":{
    "layer": [
      {
        "height": 120,
        "width": 120,
        "mark": {
          "type":"square",
          "strokeWidth": "0.5",
          "stroke": "white"
        },
        "encoding": {
          "x": {
            "field": "binA2",
            "type": "ordinal",
            "scale": {
              "domain": [
                -12,
                -11,
                -10,
                -9,
                -8,
                -7,
                -6,
                -5,
                -4,
                -3,
                -2,
                -1,
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ]
            },
            "axis": null
          },
          "y": {
            "field": "binB2",
            "type": "ordinal",
            "scale": {
              "domain": [
                9,
                8,
                7,
                6,
                5,
                4,
                3,
                2,
                1,
                0,
                -1,
                -2,
                -3,
                -4,
                -5,
                -6,
                -7,
                -8,
                -9,
                -10,
                -11,
                -12
              ]
            },
            "axis": null
          },
          "detail": {
            "field": "majorTerm",
            "type": "nominal"
          },
          "size": {
            "field": "maxpTC",
            "type": "quantitative",
            "scale": {
              "range": [
                4,
                100
              ],
              "type": "pow",
              "exponent": 2.5,
              "zero": false
            },
            "legend": null
          },
          "opacity": {
            "condition": {
              "selection": "bins",
              "value": 1
            },
            "value": 0
          },
          "color": {
            "field": "majorTermLang",
            "type": "nominal",
            "scale": {
              "domain": [],
              "range": []
            },
            "legend": null
          }
        }
      },
      {
        "height": 120,
        "width": 120,
        "selection": {
          "bins": {
            "type": "single",
            "fields": [
              "majorTerm"
            ],
            "on": "mouseover"
          }
        },
        "mark": "square",
        "encoding": {
          "x": {
            "field": "binA2",
            "type": "ordinal",
            "scale": {
              "domain": [
                -12,
                -11,
                -10,
                -9,
                -8,
                -7,
                -6,
                -5,
                -4,
                -3,
                -2,
                -1,
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ]
            },
            "axis": null
          },
          "y": {
            "field": "binB2",
            "type": "ordinal",
            "scale": {
              "domain": [
                9,
                8,
                7,
                6,
                5,
                4,
                3,
                2,
                1,
                0,
                -1,
                -2,
                -3,
                -4,
                -5,
                -6,
                -7,
                -8,
                -9,
                -10,
                -11,
                -12
              ]
            },
            "axis": null
          },
          "opacity": {
            "value": 0
          },
          "size": {
            "value": 81
          },
          "tooltip": [
            {
              "field": "majorTerm",
              "type": "nominal",
              "title": "Max Prob. Term"
            },
            {
              "field": "lab",
              "type": "nominal",
              "title": "Lab (L,a,b)"
            }
          ]
        }
      }
    ],
    "resolve": {"scale": {"color": "independent"}}
  },

  "data": {
    "values": []
  }
};