
function getHueBinHelper(colorSet){

    const totalColorSetDist = colorSet[colorSet.length - 1].cumulative_dist +
                            colorSet[colorSet.length - 1].next_dist

    // ratio for how long along the hue color line is the given color
    function getHueColorRatio(color){
        for (var i = 0; i < colorSet.length; i++) {
            if(colorEqual(colorSet[i].rgb, color)){
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
        console.log("Error, hue color not found for ratio value: ", ratio)
        throw new Error("Error, hue color not found for ratio value: ", ratio)
    }

    return {
        totalColorSetDist: totalColorSetDist,
        getHueColorRatio: getHueColorRatio,
        getHueColorFromRatio: getHueColorFromRatio
    }
}
export default {
    getHueBinHelper: getHueBinHelper
}

function colorEqual(colorA, colorB){
  // console.log(colorA);
  return colorA.r+"" === colorB.r && colorA.g+"" === colorB.g && colorA.b+"" === colorB.b;
}