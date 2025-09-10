const fs = require('fs');
const colorSet = JSON.parse(fs.readFileSync('hue_colors.json'));

let genBin = function(Nbin){

  //find binning points
  let binEndPoints = [];
  let endPoint = colorSet[colorSet.length-1].cummulative_dist + colorSet[colorSet.length-1].neighbor_dist;
  let binIndex = 1;
  for (let j = 0; j < colorSet.length; j++) {
    if (colorSet[j].cummulative_dist >= endPoint/Nbin*binIndex ) {
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
  return colorA.r === colorB.r && colorA.g === colorB.g && colorA.b === colorB.b;
}

module.exports = {
  "genBin": genBin,
  "binNum": binNum,
  "colorSet": colorSet
}