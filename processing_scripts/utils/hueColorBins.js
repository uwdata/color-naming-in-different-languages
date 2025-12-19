import fs from 'fs'
const colorSet = JSON.parse(
  fs.readFileSync('../../model/color_info_pre_naming/hue_colors_rgb.json'));

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
  throw new Error("Error, hue color not found in color set: ", color)
}
function equal(colorA, colorB){
  // console.log(colorA);
  return colorA.r+"" === colorB.r && colorA.g+"" === colorB.g && colorA.b+"" === colorB.b;
}

const totalColorSetDist = colorSet[colorSet.length - 1].cumulative_dist +
                          colorSet[colorSet.length - 1].next_dist

// ratio for how long along the hue color line is the given color
function getHueColorRatio(color){
  for (var i = 0; i < colorSet.length; i++) {
    if(equal(colorSet[i].rgb, color)){
      const currentMidpointDist = colorSet[i].cumulative_dist + colorSet[i].next_dist / 2
      return currentMidpointDist / totalColorSetDist;
    }
  }
  throw new Error("Error, hue color not found in color set: ", color)
}

function getHueColorFromRatio(ratio){
  for (var i = 0; i < colorSet.length; i++) {
    if(ratio < (colorSet[i].cumulative_dist + colorSet[i].next_dist) / totalColorSetDist){
      return colorSet[i].rgb
    }
  }
  throw new Error("Error, hue color not found for ratio value: ", color)
}

export default {
  genBin,
  binNum,
  getHueColorRatio,
  getHueColorFromRatio,
  colorSet
}