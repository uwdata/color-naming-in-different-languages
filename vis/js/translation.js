const LANG_CODE = {
  "en" : 'English (English)',
  "ko" : 'Korean (한국어, 조선어)'
};
const MIN_L = 0,
      MIN_A = -79.28728092989567,
      MIN_B = -112.02942991288025,
      MAX_L = 100,
      MAX_A = 93.55002493980824,
      MAX_B = 93.38847788323793;
const translationByDict = [
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "red", "koterm": "빨강", "by": "dict", "gid": 1 },
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "빨강", "enterm": "red", "by": "dict", "gid": 1 },

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "brown", "koterm": "갈", "by": "dict", "gid": 2 },
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "갈", "enterm": "brown", "by": "dict", "gid": 2 },

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "orange", "koterm": "주황", "by": "dict", "gid": 3},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "주황", "enterm": "orange", "by": "dict", "gid": 3},

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "yellow", "koterm": "노랑", "by": "dict", "gid": 4},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "노랑", "enterm": "yellow", "by": "dict", "gid": 4},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "연두", "enterm": "lightgreen", "by": "dict", "gid":5},

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "green", "koterm": "녹", "by": "dict" , "gid": 6},
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "green", "koterm": "초록", "by": "dict" , "gid": 6},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "초록", "enterm": "green", "by": "dict" , "gid": 6},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "하늘", "enterm": "skyblue", "by": "dict", "gid":7},

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "blue", "koterm": "청", "by": "dict", "gid": 8},
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "blue", "koterm": "파랑", "by": "dict", "gid": 8},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "파랑", "enterm": "blue", "by": "dict", "gid": 8},

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "purple", "koterm": "자주", "by": "dict", "gid": 9},
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "purple", "koterm": "보라", "by": "dict", "gid": 9},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "보라", "enterm": "purple", "by": "dict", "gid": 9},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "자주", "enterm": "purple", "by": "dict", "gid": 10},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "연보라", "enterm": "lightpurple", "by": "dict", "gid": 11},

  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "pink", "koterm": "분홍", "by": "dict", "gid": 12},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "분홍", "enterm": "pink", "by": "dict", "gid": 12},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "남", "enterm": "indigo", "by": "dict", "gid": 13},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "청록", "enterm": "turquoise", "by": "dict", "gid": 14},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "청록", "enterm": "teal", "by": "dict", "gid": 14},
  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "청록", "enterm": "cyan", "by": "dict", "gid": 14},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "회", "enterm": "gray", "by": "dict", "gid": 15},
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "gray", "koterm": "회", "by": "dict", "gid": 15},

  {"direction": "ko-en", "lang_t": "en", "lang_s": "ko", "koterm": "검정", "enterm": "black", "by": "dict", "gid": 16},
  {"direction": "en-ko", "lang_t": "ko", "lang_s": "en", "enterm": "black", "koterm": "검정", "by": "dict", "gid": 16}
];
//Papago translator
//Google Translator
//Korean-English Dictionary
// 뉴에이스 영한사전 / New Ace English-Korean Dictionary
// Copyright © 2011, 2014 DIOTEK Co., Ltd., under licence to Oxford University Press. All rights reserved.

$(document).on('ready page:load', function () {
  const rootPath = window.location.pathname.split('/').slice(0,-1).join("/");


  d3.json("../model/translation_loss/translation_loss_en_ko.json")
  .then(data => {
  d3.json("../model/full_color_names.json")
  .then(colorNames => {
  d3.json("../model/full_color_name_avgs.json")
  .then(colorNameAvgs => {
    let avgColors = getAvgColors(colorNameAvgs, colorNames);
    let translations  = translationByDict.slice();
    translationByDict.slice().forEach(td => {
      let best, minD;
      let translationByColor = {
        "direction": td.direction,
        "lang_s": td.lang_s,
        "lang_t": td.lang_t,
        "by": "color",
        "gid": td.gid
      };
      let translateInfo = data.find(d => d.koterm === td.koterm && d.enterm === td.enterm)
      td.dist = translateInfo.dist;
      if (td.lang_s === "ko") {
        minD = d3.min(data.filter(d => d.koterm === td.koterm), d => d.dist);
        best = data.find(d => d.dist === minD);
        translationByColor = Object.assign(translationByColor, {
          "koterm": td.koterm,
          "enterm": best.enterm,
          "dist": minD
        });
      } else {
        minD = d3.min(data.filter(d => d.enterm === td.enterm), d => d.dist);
        best = data.find(d => d.dist === minD);
        translationByColor = Object.assign(translationByColor, {
          "koterm": best.koterm,
          "enterm": td.enterm,
          "dist": minD
        });
      }

      translations.push(translationByColor);
    });
    translations = unique(translations, tr => tr.koterm + tr.enterm + tr.direction + tr.by + tr.gid);
    draw(translations, avgColors);
  });
  });
  });
});

const gray = "#555";
const targetSelector = "#vis";

function draw(translations, avgColors){

  //Extract terms and check each of them if it is a basic term.
  let basicTerms = translationByDict.map(d => {
    return {
      "term": d.lang_s === "ko" ? d.koterm : d.enterm,
      "lang": d.lang_s,
      "gid": d.gid,
      "basic": true
    };
  });

  let otherTerms = translations.map(d => {
    return {
      "term": d.lang_t === "ko" ? d.koterm : d.enterm,
      "lang": d.lang_t,
      "gid": d.gid,
      "basic": false
    };
  })

  let margin = {top: 30, right: 50, bottom: 50, left: 50, group: 12, term: 18},
      width = 500 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  let barMaxWidth = 100;
  let chipR = 5;

  let terms = basicTerms.concat(otherTerms).sort((a,b) => -a.basic +b.basic).sort((a,b) => a.gid - b.gid);
  terms =  unique(terms, t => t.gid + t.term);
  terms.forEach(t => {
    let avgC = avgColors.find(avgC => avgC.name === t.term && LANG_CODE[t.lang] === avgC.lang);
    t.lab = avgC.avgLABColor;
    t.avgColorCode = avgC.avgColorRGBCode;
    t.soleTarget = translations.filter(tr => {
      return t.term === (tr.lang_t === "ko" ? tr.koterm : tr.enterm);
    }).length === 1;
    t.soleSource = translations.filter(tr => {
      return t.term === (tr.lang_s === "ko" ? tr.koterm : tr.enterm);
    }).length === 1;
  });
  console.log(terms);

  let gruopSize = d3.nest().key(d => d.gid).key(d => d.lang).entries(terms);
  let maxId = 0;
  gruopSize.forEach(g_gid => {
    let lastMaxId = 0;
    g_gid.values.forEach(g_lang => {
      g_lang.values.forEach((t, i) => {
        t.subid = i;
        lastMaxId = Math.max(lastMaxId, i);
      });
    });
    g_gid.maxId = maxId;
    maxId += lastMaxId + 1;
  });

  //Divide translations into "directional" and "bidirectional"
  function viceVersa(tr1, tr2){
    return tr1.koterm === tr2.koterm &&
           tr1.enterm === tr2.enterm &&
           tr1.lang_t === tr2.lang_s &&
           tr1.by === tr2.by &&
           tr1.gid === tr2.gid;
  }
  let biDTrans = translations.filter(tr => translations.find(tr2 => viceVersa(tr, tr2)));
  let uniDTrans = translations.filter(tr => !translations.find(tr2 => viceVersa(tr, tr2)));
  biDTrans = unique(biDTrans, tr => tr.koterm + tr.enterm + tr.by + tr.gid);




  // Get Scales
  let termX = d3.scaleOrdinal().range([barMaxWidth, width-barMaxWidth]).domain(["en", "ko"]);
  let termY = t => { return t.gid * margin.group + gruopSize[t.gid - 1].maxId * margin.term + t.subid * margin.term; };
  let maxTermY = d3.max(terms, t => termY(t));
  let lineEndX = (tr, st) => {
    let lang = st === "source" ? tr.lang_s : tr.lang_t;
    let term = lang === "ko" ? tr.koterm : tr.enterm;
    let sign = lang === "ko" ? -1 : 1;
    return termX(lang) + sign * (document.getElementById(term).getComputedTextLength() + 5 + chipR*2);
  };
  let lineEndY = (tr, st) => {
    let lang = st === "source" ? tr.lang_s : tr.lang_t;
    let termName = lang === "ko" ? tr.koterm : tr.enterm;
    let term = terms.find(t => t.term === termName && tr.gid === t.gid);
    let offset = tr.by === "dict" ? -2.5 : 2.5;
    if ( (term.soleTarget && st==="target") || (term.soleSource && st==="source") ) {
      offset = 0;
    }
    return termY(term) + offset;
  };

  let colorChipX= t => {
    let term = t.lang === "ko" ? t.koterm : t.enterm;
    let sign = t.lang === "ko" ? -1 : 1;
    return termX(t.lang) + sign * (document.getElementById(t.term).getComputedTextLength() + 7);
  };
  let transLineDash = d3.scaleOrdinal().range(["5 5", undefined]).domain(["dict", "color"]);
  let transLineColor = d3.scaleOrdinal().range([gray, "#000"]).domain(["dict", "color"]);

  let barOffset = 5;
  let barX = (trans) => {
    return trans.lang_t === "ko" ?
      termX(trans.lang_t) + barOffset :
      termX(trans.lang_t) - barWidth(trans.dist) - barOffset;
  };
  let barY = (trans) => {
    let term = trans.lang_t === "ko" ? trans.koterm : trans.enterm;
    return termY(terms.find(t2 => t2.term === term && trans.gid === t2.gid));
  };
  let barHeight = 10;
  let barWidth = d3.scaleLinear().domain([0, d3.max(translations, tr => tr.dist)]).range([0, barMaxWidth]).nice();


  let svg = d3.select("#vis").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", maxTermY + margin.top + margin.bottom)
   .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  placeAxis();
  defArrowHeads(svg);

  let termTexts = svg.selectAll(".term")
    .data(terms)
   .enter().append("text")
    .attr("class", d => "term term-" + d.lang)
    .attr("id", d => d.term)
    .attr("x", d => termX(d.lang))
    .attr("y", d => termY(d))
    .attr("text-anchor", d => d.lang === "en" ? "start" : "end")
    .attr("alignment-baseline", "middle")
    .style("font-weight", d => d.basic ? "bold": "light")
    .text(d => d.term);

  let termColors = svg.selectAll(".colorChip")
    .data(terms)
   .enter().append("circle")
    .attr("class", d => "colorChip colorChip-" + d.term)
    .attr("id", d => d.term+"-colorChip")
    .attr("cx", d => colorChipX(d))
    .attr("cy", d => termY(d))
    .attr("r", 5)
    .style("fill", d => d.avgColorCode)
    .text(d => d.term);

  let translationLinesUniD = svg.selectAll(".translation.uniD")
    .data(uniDTrans)
   .enter().append("line")
    .attr("class", d => " translation uniD translation-" + d.direction)
    .attr("marker-end", d => d.by === "dict" ? "url(#arrowGray)": "url(#arrow)")
    .attr("x1", d => lineEndX(d, "source"))
    .attr("x2", d => lineEndX(d, "target"))
    .attr("y1", d => lineEndY(d, "source"))
    .attr("y2", d => lineEndY(d, "target"))
    .style("stroke", d => transLineColor(d.by))
    // .style("opacity", "1")
    // .style("stroke", "#000")
    .style("stroke-dasharray", d => transLineDash(d.by))
    .style("stroke-width", "1.5px");

  let translationLinesBiD = svg.selectAll(".translation.biD")
    .data(biDTrans)
   .enter().append("line")
    .attr("class", d => " translation biD translation-" + d.direction)
    .attr("marker-end", d => d.by === "dict" ? "url(#arrowGray)": "url(#arrow)")
    .attr("marker-start", d => d.by === "dict" ? "url(#arrowGray-start)": "url(#arrow-start)")
    .attr("x1", d => lineEndX(d, "source"))
    .attr("x2", d => lineEndX(d, "target"))
    .attr("y1", d => lineEndY(d, "source"))
    .attr("y2", d => lineEndY(d, "target"))
    .style("stroke", d => transLineColor(d.by))
    // .style("opacity", "1")
    // .style("stroke", "#000")
    .style("stroke-dasharray", d => transLineDash(d.by))
    .style("stroke-width", "1.5px");

  let distBars = svg.selectAll(".distance")
    .data(translations)
   .enter().append("rect")
    .attr("class", d => "distance distance-" + d.direction)
    .attr("x", barX)
    .attr("width", d => barWidth(d.dist))
    .attr("y", d => barY(d) - barHeight / 2)
    .attr("height", d => barHeight);

  JNDline();
  function JNDline(){
    // let jndColor = "#E45756";
    let jndColor = "#333";
    let jnds = [
      {"lang_t": "ko", "dist": 2.3},
      {"lang_t": "en", "dist": 2.3}
    ];
    let xPos = jnd => {
      return barX(jnd) + (jnd.lang_t === "ko" ? barWidth(jnd.dist) : 0);
    };
    let xPosLabel = jnd => {
      return barX(jnd) + (jnd.lang_t === "ko" ? barWidth(jnd.dist) + 3 : -25);
    };
    let jndG = svg.selectAll(".jnd")
      .data(jnds)
     .enter().append("g")
      .attr("class", ".jnd");

    jndG.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos)
      .attr("y1", 0)
      .attr("y2", maxTermY + barHeight)
      .style("stroke", jndColor)
      .style("stroke-width", "1.5px")
      .style("stroke-dasharray", "4 4");

    jndG.append("text")
      .attr("x", d => xPosLabel(d))
      .attr("y", barHeight + 3)
      .text("JND")
      .style("fill", jndColor)
      .style("font-weight", "bold");

  }
  function placeAxis(){
    let koAxis = d3.axisTop(barWidth).ticks(4).tickSize(- maxTermY - barHeight);
    let reversedBarWidth = barWidth.copy().range([0, -barMaxWidth]);
    let enAxis = d3.axisTop(reversedBarWidth).ticks(4).tickSize(- maxTermY - barHeight);
    let koAxisG = svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${termX("ko") + barOffset},0)`)
      .call(koAxis);

    koAxisG.append("text")
      .attr("x", + barMaxWidth / 2 )
      .attr("y", - 20)
      .text("Translation Loss (Eng → Kor)")
      .style("fill", "#000");

    let enAxisG = svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${termX("en") - barOffset},0)`)
      .call(enAxis);

    enAxisG.append("text")
      .attr("x", - barMaxWidth / 2 )
      .attr("y", - 20)
      .text("Translation Loss (Kor → Eng)")
      .style("fill", "#000");
  }

  placeLegend();
  function placeLegend(){
    let legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width/2}, ${maxTermY+ barHeight * 3} )`);
    legend.append("text")
      .attr("x", -width/2)
      .attr("y", 0)
      .text("Translation")
      .style("alignment-baseline", "middle")
      .style("font-weight", "bold");

    let legends = [
      { "by": "dict", "text": "By Online Translators", "xPos": -width/2 + 110 },
      { "by": "color", "text": "By Prob. Model", "xPos": -width/2 }
    ];
    let items = legend.selectAll(".legend").data(legends)
     .enter().append("g").attr("class", "legendItems");

    items.append("line")
      .attr("x1", d => d.xPos).attr("x2", d => d.xPos + 20)
      .attr("y1", 15).attr("y2", 15)
      .style("stroke-width", "1.5px")
      .style("stroke", d => transLineColor(d.by))
      // .style("stroke", "#000")
      .style("stroke-dasharray", d => transLineDash(d.by));

    items.append("text")
      .attr("x", d => d.xPos + 24)
      .attr("y", 15)
      .text(d => d.text)
      .style("alignment-baseline", "middle");

  }
}

function unique(arr, accessor) {
  return d3.nest()
    .key(accessor)
    .entries(arr)
    .map(d => d.values[0]);
}
function getLAB(bin_l, bin_a, bin_b, binSize = 10){
  let offsetBinA = Math.floor(MIN_A/binSize);
  let offsetBinB = Math.floor(MIN_B/binSize);
  return [bin_l * binSize, (bin_a + offsetBinA) * binSize, (bin_b + offsetBinB) * binSize];
}
function getAvgColors(colorNameAvgs, data){
  colorNameAvgs.forEach(avgInfo => {
    avgInfo.cnt = avgInfo.binPctCnt,
    avgInfo.rate = avgInfo.totalColorFraction
  })
  return colorNameAvgs
}

function defArrowHeads(svg){
  let defs = svg.append("svg:defs");
  defs.append("svg:marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 4.5)
      .attr("markerHeight", 4.5)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class","arrowHead");

  defs.append("svg:marker")
      .attr("id", "arrowGray")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 4.5)
      .attr("markerHeight", 4.5)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class","arrowHead")
      .style("fill", gray);

  defs.append("svg:marker")
      .attr("id", "arrow-start")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 4.5)
      .attr("markerHeight", 4.5)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,0L10,5L10,-5")
      .attr("class","arrowHead");

  defs.append("svg:marker")
      .attr("id", "arrowGray-start")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 4.5)
      .attr("markerHeight", 4.5)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,0L10,5L10,-5")
      .attr("class","arrowHead")
      .style("fill", gray);
}