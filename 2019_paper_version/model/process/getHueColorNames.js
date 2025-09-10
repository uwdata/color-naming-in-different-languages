const fs = require('fs'),
  refine = require('./refine.js'),
  colorBins = require('./colorBins.js'),
  Converter = require("csvtojson").Converter,
  d3 = require('d3');
const converter = new Converter({});
const N_BINS = 36, N_TERMS = 20;
const O_FILE_NAME = `../hue_color_names_aggregated.json`;
const O_FILE_NAME_FLATTEN = `../hue_color_names.json`;

const LANG_CODE = {
  'English (English)' : "en",
  'Korean (한국어, 조선어)' : "ko",
  'Spanish (español)': "es",
  'German (Deutsch)': "de",
  'French (français, langue française)': "fr",
  'Chinese (中文 (Zhōngwén), 汉语, 漢語)': "zh-CN",
  'Swedish (svenska)' : "sv",
  'Portuguese (português)' : "pt",
  'Polish (język polski, polszczyzna)': "pl",
  'Russian (Русский)' : "ru",
  'Dutch (Nederlands, Vlaams)': "nl",
  'Finnish (suomi, suomen kieli)': "fi",
  'Arabic (العربية)' : "ar",
  'Romanian (limba română)' : "ro",
  'Danish (dansk)': "da",
  'Italian (italiano)': "it",
  'Persian (Farsi) (فارسی)': 'fa'
};

const TOP_LANGS = ['English (English)' ,
 'Korean (한국어, 조선어)' ,
 'Spanish (español)',
 'German (Deutsch)',
 'French (français, langue française)',
 'Chinese (中文 (Zhōngwén), 汉语, 漢語)',
 'Swedish (svenska)' ,
 'Portuguese (português)' ,
 'Polish (język polski, polszczyzna)',
 'Russian (Русский)' ,
 'Dutch (Nederlands, Vlaams)',
 'Finnish (suomi, suomen kieli)',
 'Romanian (limba română)' ,
 'Persian (Farsi) (فارسی)'];


fs.createReadStream("../../raw/color_perception_table_color_names.csv").pipe(converter);
converter.on("end_parsed", function (colorNames) {
  colorNames = colorNames.filter(cn => cn.studyVersion !== "1.1.4" && cn.rgbSet === "line"); //There is a priming effect.
  colorNames = colorNames.filter(cn => cn.participantId !== 0);

  // 1. Get top languages
  let grouped = d3.nest()
    .key(d => d.lang0)
    .entries(colorNames)
    .sort((a,b) =>  - a.values.length + b.values.length)
    .filter(g => TOP_LANGS.indexOf(g.key) >=0 );


  // 2. Get top terms
  grouped.forEach(g => {
    let refined = refine(g.values, "line");
    g.terms = d3.nest().key(v => v.name).entries(refined).sort((a,b) => -a.values.length + b.values.length);

    let rankLookUp = g.terms.map(t => t.values.length);
    g.topNTerms = g.terms.filter(t => rankLookUp.indexOf(t.values.length) + 1 <= N_TERMS);

    g.terms.forEach(t => {
      t.rank = rankLookUp.indexOf(t.values.length) + 1;
    });


    //Print out the terms
    console.log(`Lang : ${g.key}`);
    console.log(`Terms : ${JSON.stringify(g.topNTerms.map(subg => subg.key))}`);

  });



  // 3. Export the data
  let bin = colorBins.genBin(N_BINS);
  let result = {};
  let flatten = [];

  grouped.forEach(group => {
    let bufFlatten = [];
    let terms = [];
    let mapped = {
      'colorNameCount': [],
      'terms': [],
      'totalCount' : 0,
      'avgColor': []
    }
    group.topNTerms.forEach(term => {
      mapped.terms.push(term.key);
      let colorNameCnt = new Array(N_BINS).fill(0);
      let [l, a, b] = [0, 0, 0];
      term.values.forEach(response => {
        colorNameCnt[colorBins.binNum(response, bin)] += 1;
        let lab = d3.lab(d3.color(`rgb(${[response.r, response.g, response.b].map(Math.floor).join(",")})`));
        l += lab.l;
        a += lab.a;
        b += lab.b;
      });
      let avgLABColor = d3.lab(l/term.values.length, a/term.values.length, b/term.values.length);
      let avgRGBColor = d3.color(avgLABColor);
      mapped.avgColor.push({
        "r": avgRGBColor.r, "g": avgRGBColor.g, "b": avgRGBColor.b
      });
      mapped.colorNameCount.push(colorNameCnt);
      mapped.totalCount += term.values.length;
      for (var i = 0; i < N_BINS; i++) {
        bufFlatten.push({
          "lang": group.key,
          "term": term.key,
          "rank": term.rank,
          "binNum": i,
          "cnt": colorNameCnt[i],
          "pCT": colorNameCnt[i] / term.values.length
        });
      }
      terms.push({
        "term": term.key,
        "modeBinNum": colorNameCnt.indexOf(d3.max(colorNameCnt))
      });
    });
    terms.sort((a,b) => a.modeBinNum - b.modeBinNum);
    bufFlatten.forEach( d => {
      d.termSubID = terms.findIndex(t => t.term === d.term);
      d.pTC = d.cnt / d3.sum(bufFlatten.filter(d2 => d2.binNum === d.binNum), x => x.cnt);
    });
    flatten = flatten.concat(bufFlatten);
    result[group.key] = mapped;
  });


  result.colorSet = bin.map(function(index, i, array){
    return colorBins.colorSet[Math.round(i===0 ? index/2 : (index + array[i-1]) / 2)];
  });

  fs.writeFileSync(O_FILE_NAME, JSON.stringify(result, null, 2));
  fs.writeFileSync(O_FILE_NAME_FLATTEN, JSON.stringify(flatten, null, 2));

});

