// not sure if this needs extra RAM, but just in case:
// node --max-old-space-size=32768 .\02_LABBinSpaceEstimate.js

// TODO: Make this check the gamut_ratio_sample_lab_delta and
// only do color conversions for colors in bins that have a 
// lower (or no gamut_ratio_sample_lab_delta) and have neighbors
// that aren't all empty or all full

import fs from 'fs'

import Color from "colorjs.io";
// Note: Since colorjs.io doesn't round rgb values to 0-255 integers like I 
// am assuming, do it myself. Similar with rounding other gamuts
function toColorSpace(color, colorSpace){
    color = color.to(colorSpace)
    if(colorSpace == "srgb"){
        return new Color(colorSpace, color.coords.map(c => Math.round(c*255)/255))
    } else {
        if(color.to(colorSpace).inGamut()){ // if in gamut, round to gamut value
            return color.toGamut()
        }
    }
    return color
}

import * as labBinHelperLib from '../utils/labBinHelper.js'

const FILE_IO_LAB_BINS = "../../model/color_info_pre_naming/oklab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

// const LAB_N_SAMPLES = 1000 // NOTE: This makes it very slow (and more accurate)
//const LAB_N_SAMPLES = 200 // ok enough
//const LAB_N_SAMPLES = 50 // For speed / test purposes (gives less accurate bin info)
const LAB_N_SAMPLES = 1000

const LAB_SAMPLE_DELTA = (labBinHelperLib.MAX_L - labBinHelperLib.MIN_L) / LAB_N_SAMPLES 

// Note, we assume last color space is largest 
// (for picking a representative color when center is out of gamut)
const COLOR_SPACES = ['srgb', 'p3', "rec2020"]

function LabDistance(color1, color2){
    if(!("l" in color1) || !("l" in color2)){
        throw new Error("LabDistance has not LAB colors")
    }
    return Math.sqrt(
    (color1.l - color2.l)**2 +
    (color1.a - color2.a)**2 +
    (color1.b - color2.b)**2
    )
}

function binSetHasAllRatios(bins){
    for(const bin of bins){
        for(const colorSpace of COLOR_SPACES){
            const colorSpacePercName = "ratio_bin_in_gamut_" + (colorSpace == "srgb" ? "rgb" : colorSpace)
            if(!(colorSpacePercName in bin)){
                return false // no calculation at all
            }else if (bin.gamut_ratio_sample_lab_delta > LAB_SAMPLE_DELTA){
                return false // we are doing a higher res calculation, so we need to run it on these bins
            }
        }
    }
    return true
}


// load all the color bin files
//  and find the min/max of all dimensions of bins
let min_l
let max_l
let max_ab

const labBinSetsForProcessing = []
for(const binSize of LAB_BIN_SIZES){
    const bins = JSON.parse(fs.readFileSync(FILE_IO_LAB_BINS+"_"+(binSize)+".json"));
    
    if(binSetHasAllRatios(bins)){
        console.log("skipping binsize " + binSize + " since it already has all ratios")
        continue
    }
    
    labBinSetsForProcessing.push({
        binSize: binSize,
        bins: bins,
        labBinHelper: labBinHelperLib.getLabBins(binSize)
    })
    // find min/max for l and a/b
    for(const bin of bins){
        // fill in initial values
        if(min_l === undefined){
            min_l = bin.l_min
        }
        if(max_l === undefined){
            max_l = bin.l_max
        }
        if(max_ab === undefined){
            if("a_max" in bin){
                max_ab = bin.a_max
            }else{
                max_ab = bin.c_max
            }
        }

        //update as needed
        if(bin.l_min < min_l){
            min_l = bin.l_min
        }
        if(bin.l_max > max_l){
            max_l = bin.l_max
        }
        if("a_max" in bin){
            if(bin.a_max > max_ab){
                max_ab = bin.a_max
            }
            if(bin.b_max > max_ab){
                max_ab = bin.b_max
            }
        } else{
            if(bin.c_max > max_ab){
                max_ab = bin.c_max
            }
        }
    }
}

console.log("bin sets for processing", labBinSetsForProcessing.map(d => d.binSize + ""))
if(labBinSetsForProcessing.length == 0){
    console.log("no bins to process")
    process.exit()
}
console.log("lmin, lmax, a/b max", min_l, max_l, max_ab)


// See if it is in gamut for srgb, p3, and rec2020
// Go through each labBin space
//  if is valid in some fashion, but in no bin record error
 // if in bin that exists, add ni


function fillInMissingBinFields(bin, binSet, thisColor, testColorInColorSpaces, isColorInGamuts){
    bin.isNewBin = true
    bin.numTestColors = getUndefinedBinCount(binSet, bin)
    // check if center of bin is in any gamut:
    let isBinCenterInAnyGamut = false
    let isBinCenterInThisBin = false
    for(const colorSpace of COLOR_SPACES){
        const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
        if(bin.center_lab.inGamut(colorSpace)){
            isBinCenterInAnyGamut = true
        }

        // check if bin for this color is this bin
        const [bin_dim_1, bin_dim_2, bin_dim_3] = 
            binSet.binSize.type == "ring" ? 
                binSet.labBinHelper.bins_from_lch(toColorSpace(bin.center_lab, colorSpace).to("oklch")) : 
                binSet.labBinHelper.bins_from_lab(toColorSpace(bin.center_lab, colorSpace).to("oklab"))
    
        if(bin[binSet.binSize.dims[0] + "_bin"] == bin_dim_1 && 
            bin[binSet.binSize.dims[1] + "_bin"] == bin_dim_2 && 
            bin[binSet.binSize.dims[2] + "_bin"] == bin_dim_3 
        ){
            isBinCenterInThisBin = true
        } else {
            bin["center_" + colorSpaceFieldName + "_in_other_bin"] = true
        }
    }
    if(!isBinCenterInAnyGamut){
        bin.representative_lab = thisColor
        bin.rep_lab_dist = LabDistance(thisColor, bin.center_lab)
    }

    for(const colorSpace of COLOR_SPACES){
        const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
        bin["num_"+colorSpaceFieldName] = 0 // no colors were found in this bin of the ~16 million tried
        bin["center_"+colorSpaceFieldName] = toColorSpace(bin.center_lab, colorSpace)

        if(!bin["center_"+colorSpaceFieldName].inGamut()){
            if(isColorInGamuts[colorSpace]){
                bin["representative_"+colorSpaceFieldName] = testColorInColorSpaces[colorSpace]
                bin["representative_"+colorSpaceFieldName+"_from_bin"] = true 
                bin["rep_lab_dist_"+colorSpaceFieldName] = LabDistance(thisColor, bin.center_lab)

                // check if bin for this color is this bin
                const [bin_dim_1, bin_dim_2, bin_dim_3] = 
                    binSet.binSize.type == "ring" ? 
                        binSet.labBinHelper.bins_from_lch(testColorInColorSpaces[colorSpace].to("oklch")) : 
                        binSet.labBinHelper.bins_from_lab(testColorInColorSpaces[colorSpace].to("oklab"))
            
                if(bin[binSet.binSize.dims[0] + "_bin"] == bin_dim_1 && 
                    bin[binSet.binSize.dims[1] + "_bin"] == bin_dim_2 && 
                    bin[binSet.binSize.dims[2] + "_bin"] == bin_dim_3 
                ){
                    bin["representative_"+colorSpaceFieldName+"_in_this_bin"] = true
                } else {
                    bin["representative_"+colorSpaceFieldName+"_in_this_bin"] = false
                }

            } else {
                bin["representative_"+colorSpaceFieldName] = "NEEDED" //mark this as needing to be fixed
            }
        }
    }
}


// track counts to undefined bins in case
// we end up adding them later
const undefinedBinCounts = {}
for(const binSet of labBinSetsForProcessing){
    undefinedBinCounts[binSet.binSize + ""] = {}
}
function addUndefinedBinCount(binSet, dim1, dim2, dim3){
    const a = undefinedBinCounts[binSet.binSize + ""]
    if(!(dim1 in a)){ a[dim1] = {} }
    const b = a[dim1]
    if(!(dim2 in b)){ b[dim2] = {} }
    const c = b[dim2]
    if(!(dim3 in c)){ c[dim3] = 0}
    c[dim3]++
}

function getUndefinedBinCount(binSet, bin){
    const binSize = binSet.binSize
    const [dim1, dim2, dim3] = binSize.dims
    if((binSize + "") in undefinedBinCounts &&
        (bin[dim1+"_bin"]) in undefinedBinCounts[binSize + ""] &&
        (bin[dim2+"_bin"]) in undefinedBinCounts[binSize + ""][bin[dim1+"_bin"]] &&
        (bin[dim3+"_bin"]) in undefinedBinCounts[binSize + ""][bin[dim1+"_bin"]][bin[dim2+"_bin"]]
    ) {
        return undefinedBinCounts[binSize + ""][bin[dim1+"_bin"]][bin[dim2+"_bin"]][bin[dim3+"_bin"]]
    }
    return 0
}


// Loop through Oklab value grid to estimate ratios
for(let l = min_l; l <= max_l; l += LAB_SAMPLE_DELTA){
    console.log(" - calculating bin properties at l", "fraction", (l - min_l) / (max_l - min_l))
    for(let a = -max_ab; a <= max_ab; a += LAB_SAMPLE_DELTA){
        for(let b = -max_ab; b <= max_ab; b += LAB_SAMPLE_DELTA){
            const testColor = new Color({space: "oklab", coords: [l, a, b]})
            const testColorInColorSpaces = {}
            const isColorInGamuts = {}
            let isColorInAnyGamut = false
            for(const colorSpace of COLOR_SPACES){
                testColorInColorSpaces[colorSpace] = toColorSpace(testColor, colorSpace)
                isColorInGamuts[colorSpace] = testColorInColorSpaces[colorSpace].inGamut()
                if(isColorInGamuts[colorSpace]){
                    isColorInAnyGamut = true
                }
            }

            // TODO: continue here
            //find what bins this color is in (if any)
            for(const binSet of labBinSetsForProcessing){
                let bin
                if(binSet.binSize.type == "ring"){
                    const [l_bin, c_bin, h_bin] 
                        = binSet.labBinHelper.bins_from_lch(testColor.to("oklch"))
                    bin = binSet.bins.find(
                        (bin) => bin.l_bin == l_bin && bin.c_bin == c_bin && bin.h_bin == h_bin)

                    if(bin === undefined && isColorInAnyGamut){
                        console.log("Can't find bin for color: " + testColor,
                            "binSize " + binSet.binSize, 
                            "\n bin missing: ", [l_bin, c_bin, h_bin] )
                        bin = binSet.labBinHelper.createLchBinInfo(l_bin, c_bin, h_bin)
                        fillInMissingBinFields(bin, binSet, testColor, testColorInColorSpaces, isColorInGamuts)
                        binSet.bins.push(bin)
                    } else if(bin === undefined){
                        addUndefinedBinCount(binSet, l_bin, c_bin, h_bin)
                    }
                }else{
                    const [l_bin, a_bin, b_bin] 
                        = binSet.labBinHelper.bins_from_lab({l: l, a: a, b: b})
                    bin = binSet.bins.find(
                        (bin) => bin.l_bin == l_bin && bin.a_bin == a_bin && bin.b_bin == b_bin)
                    if(bin === undefined && isColorInAnyGamut){
                        console.log("Can't find bin for color: " + testColor, 
                            "binSize " + binSet.binSize, 
                            " bin: ", [l_bin, a_bin, b_bin] )
                        bin = binSet.labBinHelper.createLabBinInfo(l_bin, a_bin, b_bin)
                        fillInMissingBinFields(bin, binSet, testColor, testColorInColorSpaces, isColorInGamuts)
                        binSet.bins.push(bin)
                    }else if(bin === undefined){
                        addUndefinedBinCount(binSet, l_bin, a_bin, b_bin)
                    }
                }
                // if bin, update value based on if in gamut or not
                // if bin was found, update values
                if(bin !== undefined){
                    if(!("numTestColors" in bin)){
                        bin.numTestColors = 0
                    }
                    for(const colorSpace of COLOR_SPACES){
                        const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
                        if(!(("numTestColors_"+colorSpaceFieldName) in bin)){
                            bin["numTestColors_"+colorSpaceFieldName] = 0
                        }
                    }

                    bin.numTestColors += 1

                    for(const colorSpace of COLOR_SPACES){
                        const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
                        if(isColorInGamuts[colorSpace]){
                            bin["numTestColors_"+colorSpaceFieldName] += 1
                        }
                    }

                    // If it is a new bin, try to find a representative color (or a better one)
                    // if bin has a representative color, see if this is a better one
                    if(isColorInAnyGamut){
                        const thisDist = LabDistance(testColor, bin.center_lab)

                        if("representative_lab" in bin){
                            if(!("rep_lab_dist" in bin)){
                                bin.rep_lab_dist = LabDistance(bin.representative_lab, bin.center_lab)
                            }
                            if(thisDist < bin.rep_lab_dist){
                                bin.representative_lab = testColor
                                bin.rep_lab_dist = thisDist
                            }
                        }
                        for(const colorSpace of COLOR_SPACES){
                            const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
                            
                            if(isColorInGamuts[colorSpace] &&
                                        ("representative_"+colorSpaceFieldName) in bin){

                                if(!(("rep_lab_dist_"+colorSpaceFieldName) in bin)){
                                    bin["rep_lab_dist_"+colorSpaceFieldName] = LabDistance(
                                        new Color(colorSpace, [bin["representative_"+colorSpaceFieldName].r, bin["representative_"+colorSpaceFieldName].g, bin["representative_"+colorSpaceFieldName].b])
                                            .to("oklab"),
                                        bin.center_lab)
                                }

                                // check if bin for this color is this bin
                                const thisColorInThisSpace = toColorSpace(testColor, colorSpace)
                                let thisColorInThisBin = false
                                const [bin_dim_1, bin_dim_2, bin_dim_3] = 
                                    binSet.binSize.type == "ring" ? 
                                        binSet.labBinHelper.bins_from_lch(thisColorInThisSpace.to("oklch")) : 
                                        binSet.labBinHelper.bins_from_lab(thisColorInThisSpace.to("oklab"))
                            
                                if(bin[binSet.binSize.dims[0] + "_bin"] == bin_dim_1 && 
                                    bin[binSet.binSize.dims[1] + "_bin"] == bin_dim_2 && 
                                    bin[binSet.binSize.dims[2] + "_bin"] == bin_dim_3 
                                ){
                                    thisColorInThisBin = true
                                }

                                if(thisColorInThisBin && !bin["representative_"+colorSpaceFieldName+"_in_this_bin"]){
                                    bin["representative_"+colorSpaceFieldName] = thisColorInThisSpace
                                    bin["rep_lab_dist_"+colorSpaceFieldName] = thisDist
                                    bin["representative_"+colorSpaceFieldName+"_from_bin"] = true 
                                    bin["representative_"+colorSpaceFieldName+"_in_this_bin"] = true

                                } else if(thisDist < bin["rep_lab_dist_"+colorSpaceFieldName]){
                                    bin["representative_"+colorSpaceFieldName] = thisColorInThisSpace
                                    bin["rep_lab_dist_"+colorSpaceFieldName] = thisDist
                                    bin["representative_"+colorSpaceFieldName+"_from_bin"] = true 
                                    bin["representative_"+colorSpaceFieldName+"_in_this_bin"] = thisColorInThisBin
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}



// calculate ratios for each bin
// and clean up colors
// and save files
for(const binSet of labBinSetsForProcessing){

    // calculate percentage for each bin:
    for(const bin of binSet.bins){
        bin["gamut_ratio_sample_lab_delta"] = LAB_SAMPLE_DELTA
        for(const colorSpace of COLOR_SPACES){
            const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
            bin["ratio_bin_in_gamut_" + colorSpaceFieldName] = 
                bin["numTestColors_"+colorSpaceFieldName] / bin.numTestColors
        }
    }

    // make sure new bins that need them have representative colors
    for(const bin of binSet.bins){
        for(const colorSpace of COLOR_SPACES){
            const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
            // if representative_ color marked as needed but isn't there
            if(("representative_"+colorSpaceFieldName) in bin && bin["representative_"+colorSpaceFieldName] == "NEEDED"){
                bin["representative_"+colorSpaceFieldName] = toColorSpace(bin.center_lab, colorSpace).toGamut()
                bin["representative_"+colorSpaceFieldName+"_from_bin"] = false
                bin["representative_"+colorSpaceFieldName+"_in_this_bin"] = false
            }
        }
    }


    // simplify colors and fix fields
    //  - make colors just values
    //  - get rid of representative colors if they are the same as the center color
    for(const bin of binSet.bins){
        delete bin.numTestColors
        for(const colorSpace of COLOR_SPACES){
             const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
            delete bin["numTestColors_"+colorSpaceFieldName]
        }

        delete bin.isNewBin
        delete bin.center_is_representative
        delete bin.rep_lab_dist

        // simplify color names
        bin.center_lab = {l: bin.center_lab.l, a: bin.center_lab.a, b: bin.center_lab.b}
        if("center_lch" in bin){
            bin.center_lch = {l: bin.center_lch.l, c: bin.center_lch.c, h: bin.center_lch.h}
            if(JSON.stringify(bin.center_lch) == JSON.stringify(bin.representative_lch)){
                delete bin.representative_lch
            }
        }
        if("representative_lab" in bin){
            bin.representative_lab = {l: bin.representative_lab.l, a: bin.representative_lab.a, b: bin.representative_lab.b}
            if(JSON.stringify(bin.center_lab) == JSON.stringify(bin.representative_lab)){
                delete bin.representative_lab
            }
        }
        for(const colorSpace of COLOR_SPACES){
            const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
            delete bin["rep_lab_dist_"+colorSpaceFieldName]
            if(colorSpace == "srgb"){
                // Note: "inGamut" check is a way to tell if it is a color that needs converting, or just an object with r,g,b
                if("center_rgb" in bin && "inGamut" in bin["center_rgb"]){
                    bin["center_rgb"] = {
                        r: Math.round(255*bin["center_rgb"].r), 
                        g: Math.round(255*bin["center_rgb"].g), 
                        b: Math.round(255*bin["center_rgb"].b)}
                    }
                if("representative_rgb" in bin && "inGamut" in bin["representative_rgb"]){
                    bin["representative_rgb"] = {
                        r: Math.round(255*bin["representative_rgb"].r), 
                        g: Math.round(255*bin["representative_rgb"].g), 
                        b: Math.round(255*bin["representative_rgb"].b)}
                }

                // The representative value might round to being the same as the center
                // but that means the center was technically not in gamut (e.g., small negative)
                // if(JSON.stringify(bin.center_rgb) == JSON.stringify(bin.representative_rgb)){
                //     delete bin.representative_rgb
                //     delete bin.representative_rgb_from_bin
                //     delete bin.representative_in_this_bin
                // }
            } else {
                if(!("inGamut" in bin["center_"+colorSpace])){
                    bin["center_"+colorSpace] = new Color({space: colorSpace, coords: [bin["center_"+colorSpace].r, bin["center_"+colorSpace].g, bin["center_"+colorSpace].b]})
                }
                // if(bin["center_"+colorSpace].inGamut()){ // if in gamut, round to gamut value
                //     bin["center_"+colorSpace] = bin["center_"+colorSpace].toGamut()
                // }
                bin["center_"+colorSpace] = {r: bin["center_"+colorSpace].r, g: bin["center_"+colorSpace].g, b: bin["center_"+colorSpace].b}
                if("representative_"+colorSpace in bin){
                    if(!("inGamut" in bin["representative_"+colorSpace])){
                        bin["representative_"+colorSpace] = new Color({space: colorSpace, coords: [bin["representative_"+colorSpace].r, bin["representative_"+colorSpace].g, bin["representative_"+colorSpace].b]})
                    }
                    // if(bin["representative_"+colorSpace].inGamut()){ // if in gamut, round to gamut value
                    //     bin["representative_"+colorSpace] = bin["representative_"+colorSpace].toGamut()
                    // }
                    bin["representative_"+colorSpace] = {r: bin["representative_"+colorSpace].r, g: bin["representative_"+colorSpace].g, b: bin["representative_"+colorSpace].b}
                }

                // The representative value might round to being the same as the center
                // but that means the center was technically not in gamut (e.g., small negative)
                // if(JSON.stringify(bin["center_"+colorSpace]) == JSON.stringify(bin["representative_"+colorSpace])){
                //     delete bin["representative_"+colorSpace]
                //     delete bin["representative_"+colorSpace+"_from_bin"]
                //     delete bin["representative_"+colorSpace+"_in_this_bin"]
                // }
            }
        }
    }


    // sort bins by dim1,dim2,dim3
    const [dim1, dim2, dim3] = binSet.binSize.dims
    binSet.bins.sort((a, b) =>  
        +(a[dim1+"_bin"] > b[dim1+"_bin"]) || +(a[dim1+"_bin"] === b[dim1+"_bin"]) - 1 ||
        +(a[dim2+"_bin"] > b[dim2+"_bin"]) || +(a[dim2+"_bin"] === b[dim2+"_bin"]) - 1 ||
        +(a[dim3+"_bin"] > b[dim3+"_bin"]) || +(a[dim3+"_bin"] === b[dim3+"_bin"]) - 1
    )

    console.log(`Total bins ${binSet.binSize}: `, binSet.bins.length)
    fs.writeFileSync(FILE_IO_LAB_BINS+"_"+(binSet.binSize)+".json", JSON.stringify(binSet.bins, null, 2));
}


