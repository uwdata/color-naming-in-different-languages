// const fs = require('fs'),
//   d3 = require('d3'),
//   oklab = require('../../raw/oklab.js'),
//   labBinHelperLib = require('../utils/labBinHelper.js');
import fs from 'fs'
import * as d3 from 'd3'
import oklabLib from '../../raw/oklab.js'
import labBinHelperLib from '../utils/labBinHelper.js'

import { parse, toGamut } from 'culori'

import {p3, oklab} from 'culori'

import { converter } from 'culori';

// let rgb = converter('rgb');
// let lab = converter('lab');

// rgb('#f0f0f0');
// // ⇒ { mode: "rgb", r: 0.49…, g: 0.49…, b: 0.49… }

// lab('#f0f0f0');
// // ⇒ { mode: "lab", l: 94.79…, a: 0, b: 0 }

// import { formatRgb } from 'culori';

// formatRgb('lab(50 0 0 / 25%)');
// // ⇒ "rgba(119, 119, 119, 0.25)"

import { inGamut } from 'culori';

// const inRgb = inGamut('rgb');

// inRgb('red');
// // ⇒ true

// inRgb('color(srgb 1.1 0 0)');
// // ⇒ false


import { formatCss, clampGamut } from 'culori';

// const crimson = 'color(display-p3 0.8 0.1 0.3)';
// const toRgb = clampGamut('rgb');

// formatCss(toRgb(crimson));

const FILE_O_LAB_BINS = "../../model/color_info_pre_naming/lab_p3_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES
const LAB_BIN_SIZE_ABVS = labBinHelperLib.LAB_BIN_SIZE_ABVS

//const HUE_RATIO_LAB_N = 2000 // NOTE: This makes it very slow (and more accurate)
//const HUE_RATIO_LAB_N = 200 // For speed purposes (gives less accurate bin info)
const HUE_RATIO_LAB_N = 200

const HUE_RATIO_LAB_DELTA = (labBinHelperLib.MAX_L - labBinHelperLib.MIN_L) / HUE_RATIO_LAB_N 


// This function is used to find the best RGB
// color to represent an LAB bin whose center
// is not in RGB space
function findClosestRGBToLAB(lab, rgbs){
    let min_distance = 100000
    let closest_rgb
    for(let i = 0; i < rgbs.length; i++){
        const rgb = rgbs[i]
        const rgb_lab = oklabLib.rgbToOklab(rgb)
        const dist = Math.sqrt(
            (rgb_lab.l - lab.l)**2 +
            (rgb_lab.a - lab.a)**2 +
            (rgb_lab.b - lab.b)**2
        )
        if(dist < min_distance){
            closest_rgb = rgb
            min_distance = dist
        }
    }
    return closest_rgb
}

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
        console.log(" - calculating bin properties at l", l)
        for(let a = bin.a_min - a_extra; a <= bin.a_max + a_extra; a += HUE_RATIO_LAB_DELTA){
            for(let b = bin.b_min - b_extra; b <= bin.b_max + b_extra; b += HUE_RATIO_LAB_DELTA){
                const rgb = oklabLib.oklabToValidRGB({l: l, a: a, b: b})
                

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
                    let back_lab = oklabLib.rgbToOklab(rgb)
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

for(let labBinSize of LAB_BIN_SIZES){
    const labBinHelper = labBinHelperLib.getLabBins(labBinSize)

    const BIN_L_N = labBinHelper.BIN_L_N,
    BIN_AB_N = labBinHelper.BIN_AB_N,
    MIN_L = labBinHelper.MIN_L

    // Create Bins
    console.log("Creating Bins, size", labBinSize)
    const labBinInfo = {}
    for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
        const l_bin_center = MIN_L + l_bin * labBinSize
        const l_bin_min = l_bin_center - labBinSize/2
        const l_bin_max = l_bin_center + labBinSize/2
        for(let a_bin = -(BIN_AB_N-1)/2; a_bin <= (BIN_AB_N-1)/2; a_bin ++){
            const a_bin_center = a_bin * labBinSize
            const a_bin_min = a_bin_center - labBinSize/2
            const a_bin_max = a_bin_center + labBinSize/2
            for(let b_bin = -(BIN_AB_N-1)/2; b_bin <= (BIN_AB_N-1)/2; b_bin ++){
                const b_bin_center = b_bin * labBinSize
                const b_bin_min = b_bin_center - labBinSize/2
                const b_bin_max = b_bin_center + labBinSize/2

                //calculate center color:
                let centerRGB = oklabLib.oklabToRGB({l: l_bin_center, a: a_bin_center, b: b_bin_center})
                let centerP3 = toGamut("p3")(`oklab(${l_bin_center},${a_bin_center},${b_bin_center})`)
                let binInfo = {
                    l_bin: l_bin,
                    a_bin: a_bin,
                    b_bin: b_bin,
                    l_center: l_bin_center,
                    l_min: l_bin_min,
                    l_max: l_bin_max,
                    a_center: a_bin_center,
                    a_min: a_bin_min,
                    a_max: a_bin_max,
                    b_center: b_bin_center,
                    b_min: b_bin_min,
                    b_max: b_bin_max,
                    center_rgb: {
                        r: Math.round(centerRGB.r),
                        g: Math.round(centerRGB.g),
                        b: Math.round(centerRGB.b)
                    },
                    center_p3: centerP3,
                    rgbs: []
                }
                if(!labBinInfo[l_bin]){
                    labBinInfo[l_bin] = {}
                }
                if(!labBinInfo[l_bin][a_bin]){
                    labBinInfo[l_bin][a_bin] = {}
                }
                labBinInfo[l_bin][a_bin][b_bin] = binInfo
                    
            }
        }
    }

    //Find out which bins contain rgb colors
    // Also calculate min/max of each l,a,b
    console.log("Placing rgb colors")
    const max_mins_lab_vals = {}
    function updateMaxMins(vals){
        for(const [key, val] of Object.entries(vals)){
            if(!((key+"min") in max_mins_lab_vals)){
                max_mins_lab_vals[key+"min"] = val
            }
            if(!((key+"max") in max_mins_lab_vals)){
                max_mins_lab_vals[key+"max"] = val
            }
            if(val < max_mins_lab_vals[key+"min"]){
                max_mins_lab_vals[key+"min"] = val
            }
            if(val > max_mins_lab_vals[key+"max"]){
                max_mins_lab_vals[key+"max"] = val
            }
        }
    }


    for(let r = 0; r <=255; r++){
        r % 20 == 0 ? console.log("r", r): ""
        for(let g = 0; g <= 255; g++){
            for(let b = 0; b <= 255; b++){
                //p3(`rgb(${r},${g},${b})`)
                let lab = toGamut('oklab')(`color(display-p3 ${r/255} ${g/255} ${b/255})`)
                //let lab = oklab.rgbToOklab({r: r, g: g, b: b});
                // update max and min lab values
                updateMaxMins(lab)

                let [l_bin, a_bin, b_bin] = labBinHelper.bins_from_lab(lab)
                let bin = labBinInfo[l_bin][a_bin][b_bin]
                if(!bin){
                    throw new Error(`Bin doesn't exist for rgb(${r}, ${g}, ${b}) and lab ${[lab.l, lab.a, lab.b]} ${[l_bin, a_bin, b_bin]}`)
                }
                if(lab.l < bin.l_min || lab.l > bin.l_max){
                    throw new Error("L out of range " + lab + " " + bin)
                }
                if(lab.a < bin.a_min || lab.a > bin.a_max){
                    throw new Error("A out of range " + lab + " " + bin)
                }
                if(lab.b < bin.b_min || lab.b > bin.b_max){
                    throw new Error("B out of range " + lab + " " + bin)
                }
                bin.rgbs.push(d3.rgb(r,g,b));
                // if hue color add to count
                if(!("hueColorCount" in bin)){
                    bin.hueColorCount = 0
                }

                if(Math.max(r, g, b) == 255 && Math.min(r, g, b) == 0){
                    bin.hueColorCount++
                }
            }
        }
    }

    console.log("LAB Mins and Maxes", max_mins_lab_vals)


    // fill in center/representative RGB info for bin
    // and delete bins that had no RGB colors in them
    console.log("Calculating bin RGB representative colors")
    for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
        for(let a_bin = -(BIN_AB_N-1)/2; a_bin <= (BIN_AB_N-1)/2; a_bin ++){
            for(let b_bin = -(BIN_AB_N-1)/2; b_bin <= (BIN_AB_N-1)/2; b_bin ++){
                let bin_info = labBinInfo[l_bin][a_bin][b_bin]
                if(bin_info.rgbs.length == 0){
                    delete labBinInfo[l_bin][a_bin][b_bin]
                }else{
                    let center_rgb = bin_info.center_rgb
                    bin_info.representative_rgb = center_rgb
                    bin_info.representative_lab = {l: bin_info.l_center, a: bin_info.a_center, b: bin_info.b_center}
                    if(center_rgb.r > 255 || center_rgb.r < 0 ||
                        center_rgb.g > 255 || center_rgb.g < 0 ||
                        center_rgb.b > 255 || center_rgb.b < 0
                    ){
                        //console.log("out of range rgb center", center_rgb, bin_info)
                        const center_lab = {l: bin_info.l_center, a: bin_info.a_center, b: bin_info.b_center}
                        const closest_rgb = findClosestRGBToLAB(center_lab, bin_info.rgbs)
                        bin_info.representative_rgb = {
                            r: closest_rgb.r,
                            g: closest_rgb.g,
                            b: closest_rgb.b
                        }
                        bin_info.center_p3 = toGamut('p3')(`oklab(${center_lab.l * 100}% ${center_lab.a} ${center_lab.b})`)
                        bin_info.representative_p3 = clampGamut('p3')(`oklab(${center_lab.l * 100}% ${center_lab.a} ${center_lab.b})`)
                        bin_info.representative_lab = oklabLib.rgbToOklab({r: closest_rgb.r, g: closest_rgb.g,b: closest_rgb.b})
                    }
                    bin_info.num_rgbs = bin_info.rgbs.length
                    delete bin_info.rgbs
                }
            }
            if(Object.keys(labBinInfo[l_bin][a_bin]).length == 0){
                delete labBinInfo[l_bin][a_bin]
            }
        }
        if(Object.keys(labBinInfo[l_bin]).length == 0){
            delete labBinInfo[l_bin]
        }
    }

    // console.log("calculating hue color ratio per bin")
    // for(const [l_bin, l_bin_entries] of Object.entries(labBinInfo).sort((a, b) => b[0] - a[0])){
    //     for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0])){
    //         for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries).sort((a, b) => b[0] - a[0])){
    //             getValidRgbAndHueColorRatio(b_bin_entry)
    //         }
    //     }
    // }
    

    // write out the bin info
    // count size of labBins (just for curiosity)
    // TODO: redo this as one loop, track starting labBin (and end one if different when back-converting rgb)
    let totalBins = 0
    for (const [l, l_bin] of Object.entries(labBinInfo)) {
        for (const [a, a_bin] of Object.entries(l_bin)) {
            for (const [b, b_bin] of Object.entries(a_bin)) {
                totalBins++;
            }
        }
    }
    console.log("Total bins: ", totalBins)
    fs.writeFileSync(FILE_O_LAB_BINS+"_"+(LAB_BIN_SIZE_ABVS[labBinSize])+".json", JSON.stringify(labBinInfo, null, 2));
}