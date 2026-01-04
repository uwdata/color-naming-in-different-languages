import fs from 'fs'
import Color from "colorjs.io";
import csvWriter from 'csv-write-stream'

const GAMUTS = {
    srgb: {
        correctVal: (val) => val,
        fileNameAbv: "rgb"
    },
    p3: {
        correctVal: (val) => val / 255,
        fileNameAbv: "p3"
    },
    rec2020: {
        correctVal: (val) => val / 255,
        fileNameAbv: "rec2020"
    }
}

const hueColorsByGamut = {}

for(const [gamutName, gamutInfo] of Object.entries(GAMUTS)){

    const hueColors = []

    let r = 255
    let g = 0
    let b = 0
    let cumulative_distance = 0
    let lastLab = (new Color({space: gamutName, coords: [r/255, g/255, b/255]})).to('oklab')

    function addColorInfo(){
        const lab = (new Color({space: gamutName, coords: [r/255, g/255, b/255]})).to('oklab')
        const lch = lab.to('oklch')
        const dist = Math.sqrt((lab.l - lastLab.l)**2 + (lab.a - lastLab.a)**2 + (lab.b - lastLab.b)**2)
        cumulative_distance += dist
        hueColors.push({
            "rgb": {
                r: gamutInfo.correctVal(r),
                g: gamutInfo.correctVal(g),
                b: gamutInfo.correctVal(b)
            },
            "lab": {
                l: lab.l,
                a: lab.a,
                b: lab.b
            },
            "lch": {
                l: lch.l,
                c: lch.c,
                h: lch.h
            },
            cumulative_dist: cumulative_distance
        })
        lastLab = lab
    }

    // We'll assume that 256 levels of r,g,b are 
    // sufficient for our needs in the higher gamut color spaces
    //r 255
    // g - 0 - 255
    for(g = 0; g < 255; g++){
        addColorInfo()
    }
    // r 255 - 0
    for(r = 255; r > 0; r--){
        addColorInfo()
    }
    // b - 0 - 255
    for(b = 0; b < 255; b++){
        addColorInfo()
    }
    // g - 255 - 0
    for(g = 255; g > 0; g--){
        addColorInfo()
    }
    // r  - 0 - 255
    for(r = 0; r < 255; r++){
        addColorInfo()
    }
    // b - 255 - 0
    for(b = 255; b > 0; b--){
        addColorInfo()
    }

    for(let i = 0; i < hueColors.length; i++){
        if(i != hueColors.length - 1){
            hueColors[i].next_dist = hueColors[i+1].cumulative_dist - hueColors[i].cumulative_dist
        } else {
            const nextLab = hueColors[0].lab
            const thisLab = hueColors[i].lab
            const dist = Math.sqrt((nextLab.l - thisLab.l)**2 + (nextLab.a - thisLab.a)**2 + (nextLab.b - thisLab.b)**2)
            hueColors[i].next_dist = dist
        }
    }

    console.log(hueColors)
    hueColorsByGamut[gamutName] = hueColors
    fs.writeFileSync(`../../model/color_info_pre_naming/hue_colors_${gamutInfo.fileNameAbv}.json`, JSON.stringify(hueColors, null, 2));
}


const O_HUE_BIN_FILE = `../../model/color_info_pre_naming/hue_color_bins_`;

// // should be divisible by 360, so 36 segments of 10 degrees each, or 72 segments of 20 degrees each
// //maybe next is 90 segments (4 degrees each) or 120 (3 degrees each)?
const N_BIN_OPTIONS = [120, 72, 36] 

for(const [gamutName, gamutInfo] of Object.entries(GAMUTS)){
    const hueColorSet = hueColorsByGamut[gamutName]
    for(const n_bins of N_BIN_OPTIONS){
        
        const binEndPoints = genBin(n_bins, hueColorSet);
        const hueBinWriter = csvWriter();
        hueBinWriter.pipe(fs.createWriteStream(`${O_HUE_BIN_FILE}${n_bins}_${gamutInfo.fileNameAbv}.csv`));
        
        let currBinStart = 0
        
        for(const [bin_i, binEndPoint] of binEndPoints.entries()){
            hueBinWriter.write({
                bin_i: bin_i,
                bin_start_r: hueColorSet[currBinStart].rgb.r,
                bin_start_g: hueColorSet[currBinStart].rgb.g,
                bin_start_b: hueColorSet[currBinStart].rgb.b,
                bin_end_before_r: hueColorSet[binEndPoint].rgb.r,
                bin_end_before_g: hueColorSet[binEndPoint].rgb.g,
                bin_end_before_b: hueColorSet[binEndPoint].rgb.b,
            })
            currBinStart = binEndPoint
        }
        hueBinWriter.end();
    }
}


function genBin(Nbin, colorSet){

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
