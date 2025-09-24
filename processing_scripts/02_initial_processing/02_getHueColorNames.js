const fs = require('fs'),
  colorBins = require('./hueColorBins.js'),
  csv = require("csvtojson"),
  d3 = require('d3');
//const converter = new Converter({});
const N_BINS = 36, N_TERMS = 20;
const MIN_COUNT = 400;
const O_FILE_NAME = `../hue_color_names_binned_aggregated.json`;
const O_FILE_NAME_FLATTEN = `../hue_color_names_binned.json`;

csv()
.fromFile("../cleaned_color_names.csv")
.then((colorNames)=>{
  //There is a possible priming effect for studies with version 1.1.4, but we'll ignore that for now
  colorNames = colorNames.filter(cn => cn.rgbSet === "line");
  colorNames = colorNames.filter(cn => cn.participantId !== 0);

  // 1. Get top languages
  let grouped = d3.groups(colorNames, d => d.lang0)
    .map(a => {return {key: a[0], values: a[1]}})
    .sort((a,b) =>  - a.values.length + b.values.length)
    

  // 2. Get top terms
  grouped.forEach((g) => {
    g.terms = d3.groups(g.values, v => v.name)
      .map(a => {return {key: a[0], values: a[1]}})
      .sort((a,b) => -a.values.length + b.values.length);

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
      'commonNames': [],
      'totalCount' : 0,
      'avgColor': []
    }
    group.topNTerms.forEach(term => {
      mapped.terms.push(term.key);

      //find most common name for term
      let commonName = d3.groups(term.values, t => t.standardized_entered_name)
          .map(a => {return {key: a[0], values: a[1]}})
          .sort((a,b) => -a.values.length + b.values.length)[0]
          .key
      mapped.commonNames.push(commonName)
      
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
          "commonName": commonName,
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
    if(mapped.totalCount > MIN_COUNT){ // limit what comes through
      flatten = flatten.concat(bufFlatten);
      result[group.key] = mapped;
    }
  });


  result.colorSet = bin.map(function(index, i, array){
    // get the midpoint hue color in the bin to represent the bin
    return colorBins.colorSet[Math.round(i===0 ? index/2 : (index + array[i-1]) / 2)];
  });

  fs.writeFileSync(O_FILE_NAME, JSON.stringify(result, null, 2));
  fs.writeFileSync(O_FILE_NAME_FLATTEN, JSON.stringify(flatten, null, 2));

});

