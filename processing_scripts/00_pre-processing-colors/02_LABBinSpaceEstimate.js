import fs from 'fs'
import Color from "colorjs.io";
import labBinHelperLib from '../utils/labBinHelper.js'

const FILE_O_LAB_BINS = "../../model/color_info_pre_naming/lab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

//const HUE_RATIO_LAB_N = 2000 // NOTE: This makes it very slow (and more accurate)
//const HUE_RATIO_LAB_N = 200 // For speed purposes (gives less accurate bin info)
const HUE_RATIO_LAB_N = 200

const HUE_RATIO_LAB_DELTA = (labBinHelperLib.MAX_L - labBinHelperLib.MIN_L) / HUE_RATIO_LAB_N 

// Note, we assume last color space is largest 
// (for picking a representative color when center is out of gamut)
const COLOR_SPACES = ['srgb', 'p3', "rec2020"]

// Loop through Oklab values
// See if it is in gamut for srgb, p3, and rec2020
// Go through each labBin space
//  if is valid in some fashion, but in no bin record error
 // if in bin that exists, add ni

 // Note: Start with a little extra buffer (e.g., lab from -.1 to 1.1)
 // TODO: Should go through all bins and find largest range of LAB values
//for(let l = lmin - ???)
// 
function getValidRgbAndHueColorRatio(bin){
    // if no hue colors map to this bin, skip bin:
    let hueColorCount = bin.hueColorCount
    delete bin.hueColorCount

    // This was before when we just wanted
    // hue color count, but now if we are calculating valid_rgb_ratio
    // Then we need to run this for every bin

    // if(hueColorCount == 0){
    //     //console.log("skipping bin with count", hueColorCount)
    //     bin.lab_hue_color_ratio_est = 0
    //     return
    // }

    let numHueColors = 0
    let numNonHueColors = 0
    let numOtherBinColors = 0
    let numNonValidRGB = 0

    // note: we'll go an extra 10% into each other bin
    // since lab values from other bins can map to rgb
    // values in this bin (is this enough? I don't know)
    let l_extra = (bin.l_max - bin.l_min) / 10
    let a_extra = (bin.a_max - bin.a_min) / 10
    let b_extra = (bin.b_max - bin.b_min) / 10

    for(let l = bin.l_min - l_extra; l <= bin.l_max + l_extra; l += HUE_RATIO_LAB_DELTA){
        //console.log(" - calculating bin properties at l", l)
        for(let a = bin.a_min - a_extra; a <= bin.a_max + a_extra; a += HUE_RATIO_LAB_DELTA){
            for(let b = bin.b_min - b_extra; b <= bin.b_max + b_extra; b += HUE_RATIO_LAB_DELTA){
                const rgb = oklab.oklabToValidRGB({l: l, a: a, b: b})
                

                //check if rgb is valid
                if(rgb.clipped){
                    // only count this as a non-rgb in th bin
                    // if it l,a,b was in the bin
                    // Note: since rgb's can span bins, this effectively
                    // makes bin sizes not quite all equal 
                    if(l >= bin.l_min && l <= bin.l_max &&
                        a >= bin.a_min && a <= bin.a_max &&
                        b >= bin.b_min && b <= bin.b_max
                    ){
                        numNonValidRGB++
                    }
                    
                    //console.log("invalid color, ", rgb, "from lab", [l,a,b])
                } else{ // valid rgb
                    // back-convert to LAB and make sure still in bin (since rgb's can span bins)
                    let back_lab = oklab.rgbToOklab(rgb)
                    if(back_lab.l < bin.l_min || back_lab.l > bin.l_max ||
                       back_lab.a < bin.a_min || back_lab.a > bin.a_max ||
                       back_lab.b < bin.b_min || back_lab.b > bin.b_max
                    ){
                        //console.log("color in other bin, ", rgb, "from lab", [l,a,b])
                        numOtherBinColors++
                    } else {

                        //check if rgb is hue color (at least one 255, at least one 0)
                        if(Math.max(rgb.r, rgb.g, rgb.b) == 255 && Math.min(rgb.r, rgb.g, rgb.b) == 0){
                            //console.log("hue color ", rgb, "from lab", [l,a,b])
                            numHueColors++
                        } else{
                            //console.log("non-hue color ", rgb, "from lab", [l,a,b])
                            numNonHueColors++
                        }
                    }
                }
            }
        }
    }

    if(numHueColors + numNonHueColors == 0){
        console.log("no rgb colors found in this bin")
        console.log("  - numOtherBinColors", numOtherBinColors)
        console.log("  - numNonValidRGB", numNonValidRGB)
    }

    bin.lab_hue_color_ratio_est = numHueColors / (numHueColors + numNonHueColors)
    bin.valid_rgb_ratio = (numHueColors + numNonHueColors) / (numNonValidRGB + numHueColors + numNonHueColors)

    console.log("bin hue ratio calculated", {
        numHueColors: numHueColors,
        numNonHueColors: numNonHueColors,
        hueColorRatio: bin.lab_hue_color_ratio_est,
        numOtherBinColors: numOtherBinColors,
        numNonValidRGB: numNonValidRGB,
        valid_rgb_ratio: bin.valid_rgb_ratio
    } )

}

//console.log("Total bins: ", filteredBinInfo.length)
//fs.writeFileSync(FILE_O_LAB_BINS+"_"+(labBinSize)+".json", JSON.stringify(filteredBinInfo, null, 2));
