// export GOOGLE_APPLICATION_CREDENTIALS="/Users/younghoonkim/Documents/GCD/Color Name Language-d27131f5fa62.json"



require('./tongwen_table_t2s.js'); //import chineseT2STable object
// var chNameReplacingRules = [[/藍/, "蓝"],[/桃紅/, "桃红"],[/藍/, "蓝"],[/淺藍/, "浅蓝"],[/紅/, "红"],[/亮綠/, "亮绿"],[/黃/, "黄"],[/綠/, "绿"],[/淡藍/, "蓝"],[/荧光绿/, "绿"],[/土黃/, "黄"],[/深藍/, "深蓝"],[/紅/, "红"],[/深藍/, "深蓝"],[/桃紅/, "桃红"],[/天藍/, "天蓝"],[/螢光綠/, "螢光绿"],[/螢光藍/, "螢光蓝"],[/天空藍/, "天空蓝"],[/亮藍/, "亮蓝"],[/淡藍/, "淡蓝"],[/淺綠/, "浅绿"],[/紫紅/, "紫"],[/綠/, "绿"],[/鮮紅/, "鮮红"],[/亮藍/, "亮蓝"],[/粉綠/, "粉绿"],[/淡紅/, "淡红"],[/寶藍/, "宝蓝"],[/淺橙/, "浅橙"],[/藍綠/, "蓝绿"],[/黃綠/, "黄绿"],[/亮墨綠/, "亮墨绿"],[/亮綠/, "亮绿"],[/寶藍/, "宝蓝"],[/正紅/, "正红"],[/天藍/, "天蓝"],[/螢光黃/, "荧光黄"],[/薄荷綠/, "薄荷绿"],[/淡綠/, "淡绿"],[/深黃/, "深黄"],[/深天空藍/, "深天空蓝"],[/淡粉藍/, "淡粉蓝"],[/亮黃/, "亮黄"],[/青綠/, "青绿"],[/橘紅/, "橘红"],[/黃綠/, "黄绿"],[/紫羅蘭/, "紫罗兰"],[/深粉紅/, "深粉红"],[/血紅/, "血红"],[/胭脂紅/, "胭脂红"],[/灰藍/, "灰蓝"],[/翠綠/, "翠绿"],[/粉紅/, "粉红"],[/藍紫/, "蓝紫"],[/亮紅/, "亮红"],[/亮桃紅/, "亮桃红"],[/蒂芬尼綠/, "蒂芬尼绿"],[/大紅/, "大红"],[/淡藍綠/, "淡蓝绿"],[/淺藍/, "浅蓝"],[/深紅/, "深红"],[/淡黃/, "淡黄"],[/鮮紅/, "鲜红"],[/亮深藍/, "亮深蓝"],[/亮紅/, "亮红"],[/粉藍/, "粉蓝"],[/淡粉綠/, "淡粉绿"],[/草綠/, "草绿"],[/螢光綠/, "荧光绿"],[/da hong s q/, "大红"],[/亮粉紅/, "亮粉红"],[/亮天空藍/, "亮天空蓝"],[/淺紅/, "浅红"],[/淺螢光綠/, "浅荧光绿"],[/淡綠/, "淡绿"],[/深綠/, "深绿"],[/深紅/, "深红"],[/藍綠/, "蓝绿"],[/亮藍綠/, "亮蓝绿"],[/粉紅/, "粉红"],[/天空藍/, "天空蓝"],[/橘黃/, "橘黄"],[/青藍/, "青蓝"],[/霧紅/, "雾红"]];
var chNameReplacingRules = [[/天空蓝/,"天蓝"], [/紫粉/,"粉紫"], [/萤光/,"荧光"], [/红粉/,"粉红"], [/兰/,"蓝"], [/枚红/,"玫红"], [/桔黄/,"橘黄"], [/玫瑰红/,"玫红"], [/紫蓝/,"蓝紫"], [/红紫/,"紫红"], [/绿青/,"青绿"], [/绿黄/,"黄绿"], [/荧光蓝/,"萤光蓝"], [/蓝青/,"青蓝"], [/青色带蓝/,"青蓝"]];
var enNameReplacingRules = [[/fuschia/, "fuchsia"], [/fuscia/, "fuchsia"], [/fuscia/, "fuchsia"], [/lavender/, "lavender"], [/lavender/, "lavender"], [/turqoise/, "turquoise"], [/grey/, "gray"]];
var poNameReplacingRules = [[/fucsia/, "fúcsia"], [/lilas/, "lilás"], [/turqueza/, "turquesa"], [/laranja escuto/, "laranja escuro"], [/verde mar/, "verde marinho"], [/azul maringo/, "azul marinho"], [/verdeado/, "esverdeado"], [/rosa chock/, "rosa choque"], [/purpura/, "púrpura"], [/limao/, "limão"]];
var poExcludedNames = ["blue","pink","green","red","orange","yellow","light blue","purple","turquoise","lighter blue","purpel","dark pink","dark yellow","bright green","sea blue","bright pink","light red","gold","yeallow"];

var esExcludeNames = ["blue", "orange", "pink", "green","purple","yellow","red", "light blue", "dark blue", "teal" ];
var esNameReplacingRules = [[/rosado/, "rosa"], [/cian/, "cyan"], [/limon/, "limón"], [/fuxia/, "fucsia"], [/acuamarina/, "aguamarina"], [/purpura/, "púrpura"]];

var deExcludeNames = ["blue", "cyan", "green", "red", "yellow"];
var deNameReplacingRules = [[/gruen/, "grün"]];

var frExcludeNames = ["blue", "green", "purple", "red", "light blue", "yellow", "pink", "electric blue", "king blue", "bright blue", "bright purple", "dark blue", "fluorescent green", "lime", "neon green", "vert flash", "bge", "bleu flashy", "bright green", "electrique", "france", "gold", "green water", "gtz", "jaune primaire", "light green", "marin", "orange red", "printemps", "rose forsythia", "y", "yellow green"];
var frNameReplacingRules = [[/fushia/, "fuchsia"], [/fuschia/, "fuchsia"],[/bleu marin/, "bleu marine"],[/fuchsias/, "fuchsia"],[/acide/, "vert acide"],[/aqua marine/, "aquamarine"],[/bleu gommette/, "bleu"],[/bleu prusse/, "bleu de prusse"],[/bue/, "buée"],[/ciel/, "bleu ciel"],[/jaune orange/, "jaune orangé"],[/rose rouge/, "rose, rouge 따로"],[/rouge orange/, "rouge orangé"],[/rouge vermillion/, "vermillon"],[/rouge vermillon/, "vermillon"],[/royal/, "bleu royal"],[/vert claire/, "vert clair"],[/vert jaune/, "jaune vert"],[/viloet/, "violet"],[/aqua/, "aqua frais"],[/bleau cyan/, "bleu cyan"],[/bleu claire/, "bleu clair"],[/bleu électrict/, "bleu électrique"],[/bleu émaraude/, "bleu émeraude"],[/bleu fnoncé/, "bleu foncé"],[/bleu jade/, "jade"],[/bleu pale/, "bleu pâle"],[/bleu plus pale/, "bleu plus pâle"],[/bleur/, "bleu"],[/bleur marine/, "bleu marine"],[/blue ciel/, "bleu ciel"],[/blue normal/, "bleu"],[/canard/, "bleu canard"],[/ecarlate/, "écarlate"],[/fuchia/, "fuchsia"],[/jauen/, "jaune"],[/jaunatre/, "jaunâtre"],[/jaune bouton d'or/, "bouton d'or"],[/jaune brûler/, "jaune brûlé"],[/jaune d'œuf frais/, "jaune d'œuf"],[/jaune d’oeuf/, "jaune d'œuf"],[/jaune oragne/, "jaune orangé"],[/jaune vert fluo/, "jaune fluo"],[/jeaune/, "jaune "],[/mauredoré/, "mordoré"],[/mentholé/, "menthe"],[/orange brûler/, "orange brûlé"],[/orange claire/, "orange clair"],[/orange pale/, "orange pâle"],[/orange sanguin/, "orange sanguine"],[/organge/, "orange"],[/pistaccio/, "pistache"],[/rose fuchia/, "rose fuchsia"],[/rouge orance/, "rouge orangé"],[/turquoi/, "turquoise"],[/turquoisse/, "turquoise"],[/vert mint/, "vert menthe"],[/vert outremer/, "bleu outremer"],[/verte pale/, "vert pâle"],[/very eau/, "vert d'eau"],[/violet pale/, "violet pâle"],[/voilet/, "violet"],[/volet/, "violet"]];

var itExcludeNames = ["blue"];
var itNameReplacingRules = [[/arancio$/, "arancione"], [/fuxia/, "fucsia"]];

var ruNameReplacingRules = [[/жлтый/, "желтый"], [/зелный/, "зеленый"]];

var plNameReplacingRules = [["zolty", "żółty"], ["rozowy", "różowy"], [/pomaranczowy/, "pomarańczowy"], [/blekitny/, "błękitny"], [/ciemny/, "ciemno"], [/jasny/, "jasno"]];
var plExcludedNames =["pink"];
var svExcludeNames = ["blue", "magenta", "cyan","green", "pink", "purple"];

var roExcludeNames = ["blue"];
var roNameReplacingRules = [["roșu", "rosu"], [/închis/, "inchis"]];

var nlExcludeNames = ["blue", "fuchsia", "ret", "purple"];
var daExcludeNames = ["blue", "green", "red", "teal", "darkorange",  "lightblue",  "lightgreen", "limegreen", "pinkl",  "purple", "yellow", "hot pink", "turqouise", "turquoise", "dark blue", "darkorange", "curryyellow"];
var daNameReplacingRules = [[/lille/, "lilla"],[/tyrkis/, "turkis"],[/grøm/, "grøn"]];



var fiNameReplacingRules = [["lila", "liila"]];

var arNameReplacingRules = [[/احمر/, "أحمر"], [/اخضر/, "أخضر"], [/ازرق/, "أزرق"], [/ازرقفاتح/, "أزرقفاتح"], [/اصفر/, "أصفر"], [/فوشي/, "فوشي"], [/فوشيا/, "فوشي"]];

var elNameReplacingRules = [[/μοβ/,"μωβ"]];

module.exports = function refine(cn){
    if (cn.lang0.indexOf("Korean") >= 0) {
      cn.name = cn.name.trim()
        .replace(/색$/,"")
        .replace(/\s*/g,"")
        .replace(/[a-zA-Z]/g,"")
        .replace(/파란/,"파랑")
        .replace(/노란/,"노랑")
        .replace(/빨간/,"빨강")
        .replace(/검은/,"검정")
        .replace(/연한/,"연")
        .replace(/진한/,"진")
        .replace(/청녹/,"청록");

    } else if (cn.lang0.indexOf("English") >= 0) {
      cn.name = cn.name.toString().toLowerCase()
        .replace(/\s*$/,"")
        .replace(/^\s*/,"")
        .replace(/-+/g," ")
        .replace(/[^a-zA-Z]/ig, '')
        .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, enNameReplacingRules));

    } else if (cn.lang0.indexOf("Spanish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, esNameReplacingRules));
      if (esExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Deutsch") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, deNameReplacingRules));
      if (deExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("French") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, frNameReplacingRules));
      if (frExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }

    } else if (cn.lang0.indexOf("Italian") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, itNameReplacingRules));
      if (itExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Swedish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      if (svExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    }else if (cn.lang0.indexOf("Chinese") >= 0) {
      cn.name = cn.name
                  .replace(/色$/,"")
                  .replace(/[a-zA-Z]/g,"")
                  .replace(/\s*/g,"")

      cn.name = convertChinenseT2S(cn.name);
      cn.name = (replaceByArray(cn.name, chNameReplacingRules));
    } else if (cn.lang0.indexOf("Portuguese") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, poNameReplacingRules));
    } else if (cn.lang0.indexOf("Polish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, plNameReplacingRules));
      if (plExcludedNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Danish") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, daNameReplacingRules));
      if (daExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Dutch") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      if (nlExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Romanian") >= 0) {
      cn.name = cn.name.toLowerCase().replace(/\s*$/,"").replace(/^\s*/,"").replace(/-+/g," ");
      cn.name = (replaceByArray(cn.name, roNameReplacingRules));

      if (roExcludeNames.indexOf(cn.name) >= 0 ) {
        cn.name = "";
      }
    } else if (cn.lang0.indexOf("Russian") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^а-яА-Я]/ig, '')
            .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, ruNameReplacingRules));
    } else if (cn.lang0.indexOf("Arabic") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^\u0600-\u06FF]/ig, '')
            .replace(/\s+/g," ");
      cn.name = (replaceByArray(cn.name, arNameReplacingRules));
    } else if (cn.lang0.indexOf("Persian") >= 0) {
      cn.name = cn.name.toLowerCase()
            .replace(/\s*$/,"").replace(/^\s*/,"")
            .replace(/-+/g," ").replace(/[^\u0600-\u06FF ]/ig, '');

      cn.name = cn.name.split(" ")
        .map(n => n.replace(/^ا/g,"آ").replace(/ي$/g,"ی"))
        .join("");

      // cn.name = (replaceByArray(cn.name, faNameReplacingRules));
    }else if (cn.lang0.indexOf("Finnish") >= 0) {
      cn.name = (replaceByArray(cn.name, fiNameReplacingRules));
    }else if (cn.lang0.indexOf("Greek") >= 0){
      cn.name = cn.name.toLowerCase()
          .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      cn.name = (replaceByArray(cn.name, elNameReplacingRules));
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }else if (cn.lang0.indexOf("Hebrew") >= 0){
      cn.name = cn.name.toLowerCase()
      cn.name = cn.name.replace(/[a-zA-Z]/g,"")
    }

    if(cn.lang0.indexOf("Portuguese") >= 0 && poExcludedNames.indexOf(cn.name) >= 0){
      cn.name = ""
    }
};


function convertChinenseT2S(str){
  return str.split('').map(function(c){ return !!chineseT2STable[c] ? chineseT2STable[c] : c; }).join('');
}
function replaceByArray(string, array){
  array.forEach(function(pattern){
    string = string.replace(pattern[0],pattern[1]);
  });
  return string;
}