import fs from 'fs'
import * as d3 from 'd3'
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

// This function is used to find the best RGB
// color to represent an LAB bin whose center
// is not in RGB space
function findClosestColorToLAB(lab, colors){
    let min_distance = 100000
    let closest_color
    for(let i = 0; i < colors.length; i++){
        const testColor = colors[i]
        let testLab = testColor.to("oklab")
        const dist = Math.sqrt(
            (testLab.l - lab.l)**2 +
            (testLab.a - lab.a)**2 +
            (testLab.b - lab.b)**2
        )
        if(dist < min_distance){
            closest_color = testColor
            min_distance = dist
        }
    }
    return closest_color
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
                    let centerOKLAB = (new Color({space: "oklab", coords: [l_bin_center, a_bin_center, b_bin_center]}))

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
                        center_lab: centerOKLAB
                    }
                    for(const colorSpace of COLOR_SPACES){
                        binInfo[colorSpace + "s"] = []
                        binInfo["center_"+colorSpace] = centerOKLAB.to(colorSpace)
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
                    let centerOKLCH = (new Color({space: "oklch", coords: [l_bin_center, c_bin_center, h_bin_center]}))
                    let centerOKLAB = centerOKLCH.to("oklab")
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
                        center_lch: centerOKLCH,
                        center_lab: centerOKLAB,
                    }
                    for(const colorSpace of COLOR_SPACES){
                        binInfo[colorSpace + "s"] = []
                        binInfo["center_"+colorSpace] = centerOKLCH.to(colorSpace)
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
    console.log("Placing rgb and other colors")

    // Also calculate min/max of each l,a,b
    const max_mins_lab_vals = {}
    function updateMaxMins(vals){
        for(const [key, val] of Object.entries(vals)){
            if(Number.isNaN(val)){
                continue
            }
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

    //TODO: Stop skipping
    for(const colorSpace of COLOR_SPACES){
        for(let r = 0; r <=255; r++){
            r % 20 == 0 ? console.log("r", r): ""
            for(let g = 0; g <= 255; g++){
                for(let b = 0; b <= 255; b++){
                    const newColor = new Color({space: colorSpace, coords: [r/255, g/255, b/255]})
                    
                    let okColor
                    if(labBinSize.type == "cube" || labBinSize.type == "box"){
                        okColor = newColor.to("oklab")
                    } else if(labBinSize.type == "ring"){
                        okColor = newColor.to("oklch")
                    }

                    // update max and min lab values
                    const colorVals = updateMaxMins({
                        [labBinSize.dims[0]]: okColor[labBinSize.dims[0]], 
                        [labBinSize.dims[1]]: okColor[labBinSize.dims[1]],
                        [labBinSize.dims[2]]: okColor[labBinSize.dims[2]],
                    })

                    const [bin_dim_1, bin_dim_2, bin_dim_3] = 
                        labBinSize.type == "ring" ? 
                            labBinHelper.bins_from_lch(okColor) : 
                            labBinHelper.bins_from_lab(okColor)
                    
                    const bin = labBinInfo[bin_dim_1][bin_dim_2][bin_dim_3]
                    
                    if(!bin){
                        throw new Error(`Bin doesn't exist for rgb(${r}, ${g}, ${b}) and lab ${[lab.l, lab.a, lab.b]} ${[l_bin, a_bin, b_bin]}`)
                    }
                    for(const dim of labBinSize.dims){
                        if(okColor[dim] < bin[dim+"_min"] || okColor[dim] > bin[dim+"_max"]){
                            throw new Error(`${dim} out of range ${okColor} for bin: ${bin}`)
                        }
                    }

                    bin[colorSpace + "s"].push(newColor);
                }
            }
        }
        console.log("LAB/LCH Mins and Maxes for color space", colorSpace, max_mins_lab_vals)
    }
    



    console.log("flattening bin info")
    const flattenedBinInfo = []
    for (const [l, l_bin] of Object.entries(labBinInfo)) {
        for (const [a, a_bin] of Object.entries(l_bin)) {
            for (const [b, b_bin] of Object.entries(a_bin)) {
                flattenedBinInfo.push(b_bin)
            }
        }
    }

    // fill in center/representative RGB info for bin
    // and delete bins that had no RGB colors in them
    console.log("Calculating bin RGB representative colors and removing empty bins")
    
    const filteredBinInfo = []

    for(const bin_info of flattenedBinInfo){
        let anyColorsPresent = false
        for(const colorSpace of COLOR_SPACES){
            if(bin_info[colorSpace+"s"].length > 0){
                anyColorsPresent = true
            }
        }
        if(!anyColorsPresent){
            continue
        }

        bin_info.representative_lab = bin_info.center_lab
        if(labBinSize.type == "ring"){
            bin_info.representative_lch = bin_info.center_lch
        }

        let anyCenterInGamut = false
        let alternateRepresentativeLab // Note, we assume last color space is largest
        let alternateRepresentativeLch
        for(const colorSpace of COLOR_SPACES){
            bin_info["representative_"+colorSpace] = bin_info["center_" + colorSpace]

            if(bin_info["center_" + colorSpace].inGamut()){
                anyCenterInGamut = true
            } else{
                //console.log("out of range rgb center", center_rgb, bin_info)
                let closest_color = findClosestColorToLAB(bin_info.center_lab, bin_info[colorSpace+"s"])
                if(closest_color){
                    bin_info["representative_"+colorSpace+"_in_bin"] = true
                }else{
                    bin_info["representative_"+colorSpace+"_in_bin"] = false
                    closest_color = bin_info.center_lab.to(colorSpace).toGamut()
                }
                bin_info["representative_"+colorSpace] = closest_color
                alternateRepresentativeLab = closest_color.to("oklab")
                if(labBinSize.type == "ring"){
                    alternateRepresentativeLch = closest_color.to("oklch")
                }
            }
            bin_info["num_"+colorSpace] = bin_info[colorSpace+"s"].length
            delete bin_info[colorSpace+"s"]
        }

        if(!anyCenterInGamut){
            bin_info.representative_lab = alternateRepresentativeLab
            if(labBinSize.type == "ring"){
                bin_info.representative_lch = alternateRepresentativeLch
            }
        }

        filteredBinInfo.push(bin_info)
    }


    // console.log("calculating hue color ratio per bin")
    // for(const [l_bin, l_bin_entries] of Object.entries(labBinInfo).sort((a, b) => b[0] - a[0])){
    //     for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0])){
    //         for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries).sort((a, b) => b[0] - a[0])){
    //             getValidRgbAndHueColorRatio(b_bin_entry)
    //         }
    //     }
    // }
    


    // clean up Color() objects and turn them into just json data:
    for(const binInfo of filteredBinInfo){
        //console.log(binInfo)
        for(const colorSpace of COLOR_SPACES){
            if(colorSpace == "srgb"){
                binInfo.center_rgb = {
                    r: Math.round(binInfo.center_srgb.r*255),
                    g: Math.round(binInfo.center_srgb.g*255),
                    b: Math.round(binInfo.center_srgb.b*255)
                }
                delete binInfo.center_srgb
                binInfo.representative_rgb = {
                    r: Math.round(binInfo.representative_srgb.r*255),
                    g: Math.round(binInfo.representative_srgb.g*255),
                    b: Math.round(binInfo.representative_srgb.b*255)
                }
                delete binInfo.representative_srgb

                binInfo.representative_rgb_in_bin = binInfo.representative_srgb_in_bin
                delete binInfo.representative_rgb_in_bin

                binInfo.num_rgb = binInfo.num_srgb
                delete binInfo.num_srgb

            } else{
                binInfo["center_"+colorSpace] = {r: binInfo["center_"+colorSpace].r, g: binInfo["center_"+colorSpace].g, b: binInfo["center_"+colorSpace].b}
                binInfo["representative_"+colorSpace] = {r: binInfo["representative_"+colorSpace].r, g: binInfo["representative_"+colorSpace].g, b: binInfo["representative_"+colorSpace].b}
            }
        }
        binInfo.center_lab = {l: binInfo.center_lab.l, a: binInfo.center_lab.a, b: binInfo.center_lab.b}
        binInfo.representative_lab = {l: binInfo.representative_lab.l, a: binInfo.representative_lab.a, b: binInfo.representative_lab.b}
        if(labBinSize.type == "ring"){
            binInfo.center_lch = {l: binInfo.center_lch.l, c: binInfo.center_lch.c, h: binInfo.center_lch.h}
            binInfo.representative_lch = {l: binInfo.representative_lch.l, c: binInfo.representative_lch.c, h: binInfo.representative_lch.h}
        }
    }


    console.log("Total bins: ", filteredBinInfo.length)
    fs.writeFileSync(FILE_O_LAB_BINS+"_"+(labBinSize)+".json", JSON.stringify(filteredBinInfo, null, 2));
}