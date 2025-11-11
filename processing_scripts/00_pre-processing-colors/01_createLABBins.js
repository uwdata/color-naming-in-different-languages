// Note: Storing all the colors takes a lot of space
// to increase Nodejs space:
// windows:
//  Set NODE_OPTIONS="--max-old-space-size=16384"
// linux/mac:
//  export NODE_OPTIONS="--max-old-space-size=16384"

import fs from 'fs'
import Color from "colorjs.io";
import labBinHelperLib from '../utils/labBinHelper.js'


const FILE_O_LAB_BINS = "../../model/color_info_pre_naming/lab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

// Note, we assume last color space is largest 
// (for picking a representative color when center is out of gamut)
const COLOR_SPACES = ['srgb', 'p3', "rec2020"]

const color_cache = {}
for(const colorSpace of COLOR_SPACES){
    color_cache[colorSpace] = []
}


// generate needed colors
console.log("generating colors")
for(const colorSpace of COLOR_SPACES){
    color_cache[colorSpace].sourceColor = []
    color_cache[colorSpace].oklabColor = []
    color_cache[colorSpace].oklchColor = []

    //const color_step =1  3 or 15
    const color_step = 3
    for(let r = 0; r <=255; r+=color_step){
        r % 20 == 0 ? console.log("r", r, "space", colorSpace): ""
        for(let g = 0; g <= 255; g+=color_step){
            for(let b = 0; b <= 255; b+=color_step){
                const newColor = new Color({space: colorSpace, coords: [r/255, g/255, b/255]})
                const oklabColor = newColor.to("oklab")
                const oklchColor = newColor.to("oklch")
                color_cache[colorSpace].push({
                    sourceColor: {
                        r: newColor.r,
                        g: newColor.g,
                        b: newColor.b
                    },
                    oklabColor: {
                        l: oklabColor.l,
                        a: oklabColor.a,
                        b: oklabColor.b
                    },
                    oklchColor: {
                        l: oklchColor.l,
                        c: oklchColor.c,
                        h: oklchColor.h
                    }
                })
            }
        }
    }
}



// This function is used to find the best RGB
// color to represent an LAB bin whose center
// is not in RGB space
function findClosestColorToLAB(lab, colors){
    let min_distance = 100000
    let closest_color
    for(let i = 0; i < colors.length; i++){
        const testColor = colors[i]
        let testLab = testColor.oklabColor
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

    for(const colorSpace of COLOR_SPACES){
        for(const newColor of color_cache[colorSpace]){
            let okColor
            if(labBinSize.type == "cube" || labBinSize.type == "box"){
                okColor = newColor.oklabColor
            } else if(labBinSize.type == "ring"){
                okColor = newColor.oklchColor
            }

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
                    const closest_color_source = bin_info.center_lab.to(colorSpace).toGamut()
                    closest_color = {
                        sourceColor: closest_color_source,
                        oklabColor: closest_color_source.to("oklab"),
                        oklchColor: closest_color_source.to("oklch")
                    }
                }
                bin_info["representative_"+colorSpace] = closest_color.sourceColor
                alternateRepresentativeLab = closest_color.oklabColor
                if(labBinSize.type == "ring"){
                    alternateRepresentativeLch = closest_color.oklchColor
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