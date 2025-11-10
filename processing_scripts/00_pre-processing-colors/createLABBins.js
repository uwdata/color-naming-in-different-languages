import fs from 'fs'
import * as d3 from 'd3'
//import oklabLib from '../../raw/oklab.js'
import Color from "colorjs.io";
import labBinHelperLib from '../utils/labBinHelper.js'

// const fs = require('fs'),
//   d3 = require('d3'),
//   oklab = require('../../raw/oklab.js'),
//   labBinHelperLib = require('../utils/labBinHelper');

const FILE_O_LAB_BINS = "../../model/color_info_pre_naming/lab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES
//const LAB_BIN_SIZE_ABVS = labBinHelperLib.LAB_BIN_SIZE_ABVS

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
        let rgb_lab = 
            (new Color({space: "srgb", coords: [rgb.r/255, rgb.g/255, rgb.b/255]}))
            .to("oklab")
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

for(let labBinSize of LAB_BIN_SIZES){
    const labBinHelper = labBinHelperLib.getLabBins(labBinSize)
    const BIN_L_N = labBinHelper.BIN_L_N,
        MIN_L = labBinHelper.MIN_L

    // Create Bins
    console.log("Creating Bins, size", labBinSize)
    const labBinInfo = {}

    if(labBinSize.type == "cube" || labBinSize.type == "box"){
        const BIN_AB_N = labBinHelper.BIN_AB_N

        for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
            const l_bin_center = MIN_L + l_bin * labBinSize.l
            const l_bin_min = l_bin_center - labBinSize.l/2
            const l_bin_max = l_bin_center + labBinSize.l/2
            for(let a_bin = -(BIN_AB_N-1)/2; a_bin <= (BIN_AB_N-1)/2; a_bin ++){
                const a_bin_center = a_bin * labBinSize.ab
                const a_bin_min = a_bin_center - labBinSize.ab/2
                const a_bin_max = a_bin_center + labBinSize.ab/2
                for(let b_bin = -(BIN_AB_N-1)/2; b_bin <= (BIN_AB_N-1)/2; b_bin ++){
                    const b_bin_center = b_bin * labBinSize.ab
                    const b_bin_min = b_bin_center - labBinSize.ab/2
                    const b_bin_max = b_bin_center + labBinSize.ab/2

                    //calculate center color:
                    let centerRGB = oklab.oklabToRGB({l: l_bin_center, a: a_bin_center, b: b_bin_center})
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
    }  else if(labBinSize.type == "ring") {
        const BIN_C_N = labBinHelper.BIN_C_N,
            MAX_H = labBinHelper.MAX_H

        for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
            const l_bin_center = MIN_L + l_bin * labBinSize.l
            const l_bin_min = l_bin_center - labBinSize.l/2
            const l_bin_max = l_bin_center + labBinSize.l/2
            for(let c_bin = 0; c_bin <= BIN_C_N; c_bin ++){
                const c_bin_min = c_bin * labBinSize.c
                const c_bin_max = (c_bin + 1) * labBinSize.c
                const c_bin_center = c_bin == 0 ? 0 : (c_bin_min + c_bin_max) / 2

                const hue_bin_num = 2*c_bin + 1 // number of hue bins is 2*c_bin + 1 (math in labBinHelper)
                const hue_bin_size = MAX_H / hue_bin_num
                for(let h_bin = 0; h_bin < hue_bin_num; h_bin ++){
                    
                    const h_bin_min = h_bin * hue_bin_size
                    const h_bin_max = (h_bin + 1) * hue_bin_size
                    const h_bin_center = (h_bin_min + h_bin_max) / 2

                    //calculate center color:
                    let lhcCenterRGBVals = 
                        (new Color({space: "oklch", coords: [l_bin_center, c_bin_center, h_bin_center]}))
                        .to("srgb")
                    let binInfo = {
                        l_bin: l_bin,
                        h_bin: h_bin,
                        c_bin: c_bin,
                        l_center: l_bin_center,
                        l_min: l_bin_min,
                        l_max: l_bin_max,
                        c_center: c_bin_center,
                        c_min: c_bin_min,
                        c_max: c_bin_max,
                        h_center: h_bin_center,
                        h_min: h_bin_min,
                        h_max: h_bin_max,
                        center_rgb: {
                            r: Math.round(lhcCenterRGBVals.r*255),
                            g: Math.round(lhcCenterRGBVals.g*255),
                            b: Math.round(lhcCenterRGBVals.b*255)
                        },
                        rgbs: []
                    }
                    if(!labBinInfo[l_bin]){
                        labBinInfo[l_bin] = {}
                    }
                    if(!labBinInfo[l_bin][c_bin]){
                        labBinInfo[l_bin][c_bin] = {}
                    }
                    labBinInfo[l_bin][c_bin][h_bin] = binInfo
                        
                }
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
                let bin
                if(labBinSize.type == "cube" || labBinSize.type == "box"){
                    let lab = (new Color({space: "srgb", coords: [r/255, g/255, b/255]})).to("oklab")
                    //let lab = oklab.rgbToOklab({r: r, g: g, b: b});
                    // update max and min lab values
                    updateMaxMins(lab)

                    let [l_bin, a_bin, b_bin] = labBinHelper.bins_from_lab(lab)
                    bin = labBinInfo[l_bin][a_bin][b_bin]
                    if(!bin){
                        throw new Error(`Bin doesn't exist for rgb(${r}, ${g}, ${b}) and lab ${[lab.l, lab.a, lab.b]} ${[l_bin, a_bin, b_bin]}`)
                    }
                    if(lab.l < bin.l_min || lab.l > bin.l_max){
                        throw new Error("L out of range " + lab + " " + bin)
                    }
                    if(lab.a < bin.a_min || lab.a > bin.a_max){
                        throw new Error("C out of range " + lab + " " + bin)
                    }
                    if(lab.b < bin.b_min || lab.b > bin.b_max){
                        throw new Error("B out of range " + lab + " " + bin)
                    }
                } else if(labBinSize.type == "ring"){
                    let lch = (new Color({space: "srgb", coords: [r/255, g/255, b/255]})).to("oklch")
                    //let lab = oklab.rgbToOklab({r: r, g: g, b: b});
                    // update max and min lab values
                    updateMaxMins({l: lch.l, c: lch.c, h: lch.h})
            
                    let [l_bin, c_bin, h_bin] = labBinHelper.bins_from_lch(lch)
                    bin = labBinInfo[l_bin][c_bin][h_bin]
                    if(!bin){
                        throw new Error(`Bin doesn't exist for rgb(${r}, ${g}, ${b}) and lch ${[lch.l, lch.c, lch.h]} ${[l_bin, c_bin, h_bin]}`)
                    }
                    if(lch.l < bin.l_min || lch.l > bin.l_max){
                        throw new Error("L out of range " + lch + " " + bin)
                    }
                    if(lch.c < bin.c_min || lch.c > bin.c_max){
                        throw new Error("C out of range " + lch + " " + bin)
                    }
                    if(lch.h < bin.h_min || lch.h > bin.h_max){
                        throw new Error("H out of range " + lch + " " + bin)
                    }
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

    console.log("LCH Mins and Maxes", max_mins_lab_vals)


    // fill in center/representative RGB info for bin
    // and delete bins that had no RGB colors in them
    console.log("Calculating bin RGB representative colors")
    if(labBinSize.type == "cube" || labBinSize.type == "box"){
        //TODO: Copy old code
    } else if(labBinSize.type == "ring"){
        const BIN_C_N = labBinHelper.BIN_C_N,
            MAX_H = labBinHelper.MAX_H
        for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
            for(let c_bin = 0; c_bin <= BIN_C_N; c_bin ++){
                const hue_bin_num = 2*c_bin + 1 // number of hue bins is 2*c_bin + 1 (math in labBinHelper)
                const hue_bin_size = MAX_H / hue_bin_num
                for(let h_bin = 0; h_bin < hue_bin_num; h_bin ++){
                    let bin_info = labBinInfo[l_bin][c_bin][h_bin]
                    if(bin_info.rgbs.length == 0){
                        delete labBinInfo[l_bin][c_bin][h_bin]
                    }else{
                        let center_rgb = bin_info.center_rgb
                        bin_info.representative_rgb = center_rgb
                        bin_info.representative_lch = {l: bin_info.l_center, c: bin_info.c_center, h: bin_info.h_center}
                        let representative_lab = (new Color({space: "oklch", coords: [bin_info.l_center, bin_info.c_center, bin_info.h_center]}))
                            .to("oklab")
                        bin_info.representative_lab = {l: representative_lab.l, a: representative_lab.a, b: representative_lab.b}
                            
                        if(center_rgb.r > 255 || center_rgb.r < 0 ||
                            center_rgb.g > 255 || center_rgb.g < 0 ||
                            center_rgb.b > 255 || center_rgb.b < 0
                        ){
                            console.log("out of range rgb center", center_rgb, bin_info)
                            const closest_rgb = findClosestRGBToLAB(bin_info.representative_lab, bin_info.rgbs)
                            bin_info.representative_rgb = {
                                r: closest_rgb.r,
                                g: closest_rgb.g,
                                b: closest_rgb.b
                            }
                            representative_lab = (new Color({space: "srgb", coords: [closest_rgb.r/255, closest_rgb.g/255, closest_rgb.b/255]}))
                                .to("oklab")
                            bin_info.representative_lab = representative_lab
                        }
                        bin_info.num_rgbs = bin_info.rgbs.length
                        delete bin_info.rgbs
                    }
                }
                if(Object.keys(labBinInfo[l_bin][c_bin]).length == 0){
                    delete labBinInfo[l_bin][c_bin]
                }
            }
            if(Object.keys(labBinInfo[l_bin]).length == 0){
                delete labBinInfo[l_bin]
            }
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
    fs.writeFileSync(FILE_O_LAB_BINS+"_"+(labBinSize)+".json", JSON.stringify(labBinInfo, null, 2));
}