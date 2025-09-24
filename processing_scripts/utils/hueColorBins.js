const fs = require('fs');
const colorSet = JSON.parse(
  fs.readFileSync('../../model/color_info_pre_naming/hue_colors.json'));

let genBin = function(Nbin){

  //find binning points
  let binEndPoints = [];
  let endPoint = colorSet[colorSet.length-1].cumulative_dist + colorSet[colorSet.length-1].next_dist;
  let binIndex = 1;
  for (let j = 0; j < colorSet.length; j++) {
    if (colorSet[j].cumulative_dist >= endPoint/Nbin*binIndex ) {
      binEndPoints.push(j);
      binIndex += 1;
    };
  };
  binEndPoints.push(colorSet.length-1);
  return binEndPoints;
}

var binN = process.argv[2] || 36;


let binNum = function(response, binEndPoints){
  for (var i = 0; i < colorSet.length; i++) {
    if(equal(colorSet[i].rgb, response)){
      for (var j = 0; j < binEndPoints.length; j++) {
        if (i <= binEndPoints[j]) {
          return j;
        }
      }
    }
  }
}
function equal(colorA, colorB){
  // console.log(colorA);
  return colorA.r+"" === colorB.r && colorA.g+"" === colorB.g && colorA.b+"" === colorB.b;
}

module.exports = {
  "genBin": genBin,
  "binNum": binNum,
  "colorSet": colorSet
}