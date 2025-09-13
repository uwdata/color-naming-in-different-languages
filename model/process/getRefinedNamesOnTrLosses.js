const fs = require('fs'),
  csv = require("csvtojson"),
  d3 = require('d3'),
  csvWriter = require('csv-write-stream');

const FILE_I = "../basic_full_color_info.csv"; // Path for the output
const trLossFiles = fs.readdirSync("../translation_loss");

csv().fromFile(FILE_I)
  .then((colorNames)=>{
    function findSimplifiedTerm(query, lang_abv){
      const matchColor = colorNames.find(d => d.simplifiedName  === query && d.lang_abv == lang_abv)
      return matchColor.simplifiedName;
    }

    trLossFiles.forEach(f => {
      trLosses = JSON.parse(fs.readFileSync("../translation_loss/"+f));
      let langAbvs = f.replace(".json","")
        .split("_")
        .slice(2,4)

      let langs = f.replace(".json","")
        .split("_")
        .slice(2,4)
        .map(lang => lang+"term");
      if (langs[0] === langs[1]) {
        langs[1] = langs[1]+"2";
      }

      trLosses = trLosses.filter(l => l.dist);
      trLosses.forEach(l => {
        l[langs[0]+"_refined"] = findSimplifiedTerm(l[langs[0]], langAbvs[0]);
        l[langs[1]+"_refined"] = findSimplifiedTerm(l[langs[1]], langAbvs[1]);
      });
      fs.writeFileSync("../translation_loss/"+f, JSON.stringify(trLosses, null, 2));
    });


});

