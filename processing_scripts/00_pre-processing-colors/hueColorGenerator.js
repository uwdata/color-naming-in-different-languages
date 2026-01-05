import fs from 'fs'
import Color from "colorjs.io";
import csvWriter from 'csv-write-stream'
import hueBinHelper from '../utils/hueBinHelper.js'

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
        
        const hueBins = genBins(n_bins, hueColorSet);
        const hueBinWriter = csvWriter();
        hueBinWriter.pipe(fs.createWriteStream(`${O_HUE_BIN_FILE}${n_bins}_${gamutInfo.fileNameAbv}.csv`));
                
        for(const [bin_i, hueBin] of hueBins.entries()){
            hueBinWriter.write(hueBin)
        }
        hueBinWriter.end();
    }
}


function genBins(Nbin, colorSet){
    const binHelper = hueBinHelper.getHueBinHelper(colorSet)
    const totalColorSetDist = binHelper.totalColorSetDist

    const bins = []

    for(let i = 0; i < Nbin; i++){
        // first bin centered at 0 (i.e. rgb(255,0,0))
        const centerDist = 1/Nbin*i
        let startDist = 1/Nbin*(i-0.5)
        let endDist = 1/Nbin*(i+0.5)

        if(startDist < 0){
            startDist = 1 + startDist
        }

        const startColor = binHelper.getHueColorFromRatio(startDist)
        const centerColor = binHelper.getHueColorFromRatio(centerDist)
        const endBeforeColor = binHelper.getHueColorFromRatio(endDist)

        bins.push({
            bin_i: i,
            bin_start_r: startColor.r,
            bin_start_g: startColor.g,
            bin_start_b: startColor.b,

            bin_center_r: centerColor.r,
            bin_center_g: centerColor.g,
            bin_center_b: centerColor.b,

            bin_end_before_r: endBeforeColor.r,
            bin_end_before_g: endBeforeColor.g,
            bin_end_before_b: endBeforeColor.b
        })
    }

    return bins
}
