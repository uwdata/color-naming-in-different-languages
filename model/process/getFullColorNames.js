const fs = require('fs'),
  refine = require('./refine.js'),
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

const LANG_CODE = {
  'English (English)' : "en",
  'Korean (한국어, 조선어)' : "ko"
};

const CLUSTERED_TERMS = ["blue","green","purple","pink","red","orange","yellow","brown","black","gray","보라","파랑","연두","하늘","초록","자주","빨강","분홍","연보라","주황","청록","갈","남","노랑","검정","회"];



fs.createReadStream("../../raw/color_perception_table_color_names.csv").pipe(converter);
converter.on("end_parsed", function (colorNames) {
  colorNames = colorNames.filter(cn => Object.keys(LANG_CODE).indexOf(cn.lang0) >= 0 );
  colorNames = colorNames.filter(cn => cn.participantId !== 0);
  colorNames = colorNames.filter(cn => !(cn.studyVersion === "1.1.4" && cn.rgbSet === "line")); //There is a priming effect for that set.

  colorNames.forEach(cn => {
    let lab = d3.lab(d3.color(`rgb(${cn.r}, ${cn.g}, ${cn.b})`));

    cn.lab_l = lab.l;
    cn.lab_a = lab.a;
    cn.lab_b = lab.b;
  });


  let grouped = d3.nest()
    .key(d => d.lang0)
    .entries(colorNames)
    .sort((a,b) =>  - a.values.length + b.values.length);

  grouped.forEach(g => {
    g.terms = d3.nest()
                .key(v => v.name)
                .entries(refine(g.values, RGB_SET))
                .sort((a,b) => -a.values.length + b.values.length);

    g.terms = g.terms.filter(g_term => g_term.values.length >= MIN_NperTerm);

  });

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
              "majorTerm": bufFlatten.find(d => d.binL === l && d.binA === a && d.binB === b && d.pTC === maxpTC ).term
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



  vlSpec.data = { "values": saliency };


  let avgColors = getAvgColors(flatten, unique(saliency.map(d => d.majorTerm)));
  vlSpec.spec.encoding.color.scale = {
    "domain": avgColors.map(c => c.name),
    "range": avgColors.map(c => c.avgColorRGBCode)
  };
  fs.writeFileSync(FILE_O_VIS, JSON.stringify(vlSpec, null, 2));
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

    topTerms.forEach(g_term => {
      let cnt = d3.sum(g_term.values, d => d.pTC);
      let avgL = d3.sum(g_term.values, d => d.binL * d.pCT);
      let avgA = d3.sum(g_term.values, d => d.binA * d.pCT);
      let avgB = d3.sum(g_term.values, d => d.binB * d.pCT);
      d3.color(d3.lab(...labBinner.getLAB(avgL, avgA, avgB))).toString();

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
      "calculate": "10+datum.saliency",
      "as": "sal"
    },
    {
      "calculate": "datum.lab",
      "as": "lab2"
    }
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
    "height": 144,
    "width": 144,

    "selection": {
      "bins": {
        "type": "single",
        "fields": [
          "majorTerm"
        ],
        "on": "mouseover"
      }
    },
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
            9,
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
        "field": "majorTerm",
        "type": "nominal",
        "scale": {
          "domain": [],
          "range": []
        },
        "legend": null
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
    },
    "resolve": {"scale": {"color": "independent"}}
  },

  "data": {
    "values": []
  }
};