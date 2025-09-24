const fs = require('fs'),
  d3 = require('d3')
  labBinHelperLib = require('../utils/labBinHelper');

// estimate the ratio of LAB colors that are Hue colors (1 or 2 of r,g, or b at 255, 1 at 0)

LAB_DELTA = .01

let numHueColors = 0
let numNonHueColors = 0

for(let l = labBinHelperLib.MIN_L - LAB_DELTA; l <= labBinHelperLib.MAX_L + LAB_DELTA; l += LAB_DELTA){
    if(l % 20 == 0){
        console.log("l", l)
    }
    for(let a = -labBinHelperLib.MIN_MAX_AB - LAB_DELTA; a <= labBinHelperLib.MIN_MAX_AB + LAB_DELTA; a++){
        for(let b = -labBinHelperLib.MIN_MAX_AB - LAB_DELTA; b <= labBinHelperLib.MIN_MAX_AB + LAB_DELTA; b++){
            const rgb = d3.lab(l,a,b).rgb()
            const rounded_rgb = {r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b)}

            //check if rgb is valid
            if(Math.max(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) > 255 || Math.min(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) < 0){
                //console.log("invalid color, ", rounded_rgb, "from lab", [l,a,b])
            } else{ // valid rgb
                //check if rgb is hue color (at least one 255, at least one 0)
                if(Math.max(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) == 255 && Math.min(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) == 0){
                    //console.log("hue color ", rounded_rgb, "from lab", [l,a,b])
                    numHueColors++
                } else{
                    //console.log("non-hue color ", rounded_rgb, "from lab", [l,a,b])
                    numNonHueColors++
                }
            }
        }
    }
}

const output = {
    numHueColors: numHueColors,
    numNonHueColors: numNonHueColors,
    hueColorRatio: numHueColors / (numHueColors + numNonHueColors),
    estimate_lab_delta: LAB_DELTA
} 

console.log(output)
fs.writeFileSync("../../model/color_info_pre_naming/lab_hue_color_ratio.json", JSON.stringify(output, null, 2));