import fs from 'fs'
import Color from "colorjs.io";
import * as labBinHelperLib from '../utils/labBinHelper.js'

const FILE_IO_LAB_BINS = "../../model/color_info_pre_naming/oklab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

//const HUE_RATIO_LAB_N = 2000 // NOTE: This makes it very slow (and more accurate)
//const HUE_RATIO_LAB_N = 200 // For speed purposes (gives less accurate bin info)
const HUE_RATIO_LAB_N = 20

const HUE_RATIO_LAB_DELTA = (labBinHelperLib.MAX_L - labBinHelperLib.MIN_L) / HUE_RATIO_LAB_N 

// Note, we assume last color space is largest 
// (for picking a representative color when center is out of gamut)
const COLOR_SPACES = ['srgb', 'p3', "rec2020"]

function LabDistance(color1, color2){
    return Math.sqrt(
    (color1.l - color2.l)**2 +
    (color1.a - color2.a)**2 +
    (color1.b - color2.b)**2
    )
}


// load all the color bin files
//  and find the min/max of all dimensions of bins
let min_l
let max_l
let max_ab

const labBinSets = []
for(const binSize of LAB_BIN_SIZES){
    const bins = JSON.parse(fs.readFileSync(FILE_IO_LAB_BINS+"_"+(binSize)+".json"));
    labBinSets.push({
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

console.log("lmin, lmax, a/b max", min_l, max_l, max_ab)


// See if it is in gamut for srgb, p3, and rec2020
// Go through each labBin space
//  if is valid in some fashion, but in no bin record error
 // if in bin that exists, add ni


function fillInMissingBinFields(bin, thisColor, thisColorSpace){
    bin.isNewBin = true
    // check if center of bin is in any gamut:
    let isBinCenterInAnyGamut = false
    for(const colorSpace of COLOR_SPACES){
        if(bin.center_lab.inGamut(colorSpace)){
            isBinCenterInAnyGamut = true
        }
    }
    if(!isBinCenterInAnyGamut){
        bin.representative_lab = thisColor
        //bin.center_is_representative = false
        bin.rep_lab_dist = LabDistance(thisColor, bin.center_lab)
    }

    for(const colorSpace of COLOR_SPACES){
        const colorSpaceFieldName = colorSpace == "srgb" ? "rgb" : colorSpace
        bin["num_"+colorSpaceFieldName] = 0 // no colors were found in this bin of the ~16 million tried
        bin["center_"+colorSpace] = bin.center_lab.to(colorSpace)
    }

    // TODO: refigure out representative colors
    const thisColorSpaceFieldName = thisColorSpace == "srgb" ? "rgb" : thisColorSpace
    bin["representative_"+thisColor] = thisColor
    // The color we are creating this bin for exists (though there are weird cases due to rounding, particularly of srgb)
    bin["representative_"+thisColor+"_in_bin"] = true 
}

//TODO: representative color

for(const [colorSpace_i, colorSpace] of COLOR_SPACES.entries()){
    const colorSpacePercName = "ratio_bin_in_gamut_" + colorSpaceFieldName
    // see which, if any bins, don't have values already for this color space ratio
    const binSetsForThisColorSpace = []
    
    for(const labBinSet of labBinSets){
        for(const bin of labBinSet.bins){
            if(!(colorSpacePercName in bin)){
                binSetsForThisColorSpace.push(labBinSet)
                break
            }
        }
    }

    // remove representative_colors that are the same as center colors:
    for(const labBinSet of labBinSets){
        for(const bin of labBinSet.bins){
            if(JSON.stringify(bin.center_lab) == JSON.stringify(bin.representative_lab)){
                delete bin.representative_lab
            }
            for(const tmpColorSpace of COLOR_SPACES){
                const tmpColorSpaceAbv = tmpColorSpace == "srgb"? rgb : tmpColorSpace
                if(JSON.stringify(bin["center_"+tmpColorSpaceAbv]) == JSON.stringify(bin["representative_"+tmpColorSpaceAbv])){
                    delete bin["representative_"+tmpColorSpaceAbv]
                }
            }
        }
    }

    console.log("calculating percentage for space ", colorSpace, " and for ", binSetsForThisColorSpace.length, "bin sets")

    // Loop through Oklab values
    for(let l = min_l; l <= max_l; l += HUE_RATIO_LAB_DELTA){
        console.log(" - calculating bin properties at l", l)
        for(let a = -max_ab; a <= max_ab; a += HUE_RATIO_LAB_DELTA){
            for(let b = -max_ab; b <= max_ab; b += HUE_RATIO_LAB_DELTA){
                const testColor = new Color({space: "oklab", coords: [l, a, b]})
                const isColorInGamut = testColor.inGamut(colorSpace)

                //find what bins this color is in (if any)
                for(const binSet of binSetsForThisColorSpace){
                    let bin
                    if(binSet.binSize.type == "ring"){
                        const [l_bin, c_bin, h_bin] 
                            = binSet.labBinHelper.bins_from_lch(testColor.to("oklch"))
                        bin = binSet.bins.find(
                            (bin) => bin.l_bin == l_bin && bin.c_bin == c_bin && bin.h_bin == h_bin)

                        if(bin === undefined && isColorInGamut){
                            console.log("Can't find bin for color: " + testColor,
                                " in gamut: " + testColor.to(colorSpace),
                                "binSize" + binSet.binSize, 
                                "\n bin missing: ", [l_bin, c_bin, h_bin] )
                            bin = binSet.labBinHelper.createLchBinInfo(l_bin, c_bin, h_bin)
                            fillInMissingBinFields(bin, testColor, colorSpace)
                            binSet.bins.push(bin)
                        }
                    }else{
                        const [l_bin, a_bin, b_bin] 
                            = binSet.labBinHelper.bins_from_lab({l: l, a: a, b: b})
                        bin = binSet.bins.find(
                            (bin) => bin.l_bin == l_bin && bin.a_bin == a_bin && bin.b_bin == b_bin)
                        if(bin === undefined && isColorInGamut){
                            console.log("Can't find bin for color: " + testColor, 
                                " in gamut: " + testColor.to(colorSpace),
                                "binSize" + binSet.binSize, 
                                " bin: ", [l_bin, a_bin, b_bin] )
                            bin = binSet.labBinHelper.createLabBinInfo(l_bin, a_bin, b_bin)
                            fillInMissingBinFields(bin, testColor, colorSpace)
                            binSet.bins.push(bin)
                        }
                    }
                    //TODO: if bin, update value based on if in gamut or not
                    if(bin !== undefined){
                        if(!("numTestColors" in bin)){
                            bin.numTestColors = 0
                        }
                        if(!(("numTestColors_"+colorSpace) in bin)){
                            bin["numTestColors_"+colorSpace] = 0
                        }

                        bin.numTestColors += 1

                        if(isColorInGamut){
                            bin["numTestColors_"+colorSpace] += 1
                        }

                        // TODO, if it is a new bin, see if we have a better representative color
                        if(bin.isNewBin && !bin.center_is_representative){
                            if(testColor){
                                const thisDist = LabDistance(testColor, bin.center_lab)
                                if(thisDist < bin.rep_lab_dist){
                                    bin.representative_lab = testColor
                                    bin.rep_lab_dist = thisDist
                                    //TODO: potentially update other color representative values

                                }
                            }
                        }
                    }
                }
            }
        }
    }


    // calculate percentage for each bin:
    for(const binSet of binSetsForThisColorSpace){
        for(const bin of binSet.bins){
            bin[colorSpacePercName] = 
                bin["numTestColors_"+colorSpace] / bin.numTestColors

            // if a new bin was made and previous colorSpaces hadn't 
            // done anything with it yet, then the percent of that space was 0
            for(const [earlier_color_space_i, earlierColorSpace] of COLOR_SPACES.entries()){
                if(earlier_color_space_i < colorSpace_i){
                    bin["ratio_bin_in_gamut_" + 
                        (earlierColorSpace == "srgb" ? "rgb" : earlierColorSpace) ]
                     = 0
                }
            }
        }
    }

    // simplify colors and fix fields
    //  - make colors just values
    //  - get rid of representative colors if they are the same as the center color
    for(const labBinSet of binSetsForThisColorSpace){
        for(const bin of labBinSet.bins){
            delete bin.numTestColors
            delete bin["numTestColors_"+colorSpace]
            if(bin.isNewBin){
                console.log("test")
            }
            delete bin.isNewBin
            delete bin.center_is_representative
            delete bin.rep_lab_dist

            // simplify color names
            bin.center_lab = {l: bin.center_lab.l, a: bin.center_lab.a, b: bin.center_lab.b}
            if("center_lch" in bin){
                bin.center_lch = {l: bin.center_lch.l, c: bin.center_lch.c, h: bin.center_lch.h}
            }
            if("representative_lab" in bin){
                bin.representative_lab = {l: bin.representative_lab.l, a: bin.representative_lab.a, b: bin.representative_lab.b}
            }
            for(const tmpColorSpace of COLOR_SPACES){
                if(tmpColorSpace == "srgb"){
                    if("center_srgb" in bin){
                        bin["center_rgb"] = {
                            r: Math.round(255*bin["center_srgb"].r), 
                            g: Math.round(255*bin["center_srgb"].g), 
                            b: Math.round(255*bin["center_srgb"].b)}
                        }
                    if("representative_srgb" in bin){
                        bin["representative_rgb"] = {
                            r: Math.round(255*bin["representative_srgb"].r), 
                            g: Math.round(255*bin["representative_srgb"].g), 
                            b: Math.round(255*bin["representative_srgb"].b)}
                    }
                } else {
                    bin["center_"+tmpColorSpace] = {r: bin["center_"+tmpColorSpace].r, g: bin["center_"+tmpColorSpace].g, b: bin["center_"+tmpColorSpace].b}
                    if("representative_"+tmpColorSpace in bin){
                        bin["representative_"+tmpColorSpace] = {r: bin["representative_"+tmpColorSpace].r, g: bin["representative_"+tmpColorSpace].g, b: bin["representative_"+tmpColorSpace].b}
                    }
                }
            }
        }
        // remove "representative_" values if they are the same as the center values

    }

    // write the current version of the lab bin file
    for(const labBinSet of binSetsForThisColorSpace){
        // sort bins by dim1,dim2,dim3
        // const [dim1, dim2, dim3] = labBinSet.binSize.dims
        // labBinSet.bins.sort((a, b) =>  
        //     +(a[dim1+"_bin"] > b[dim1+"_bin"]) || +(a[dim1+"_bin"] === b[dim1+"_bin"]) - 1 ||
        //     +(a[dim2+"_bin"] > b[dim2+"_bin"]) || +(a[dim2+"_bin"] === b[dim2+"_bin"]) - 1 ||
        //     +(a[dim3+"_bin"] > b[dim3+"_bin"]) || +(a[dim3+"_bin"] === b[dim3+"_bin"]) - 1
        
        // )
        console.log(`Total bins ${labBinSet.binSize}: `, labBinSet.bins.length)
        fs.writeFileSync(FILE_IO_LAB_BINS+"_"+(labBinSet.binSize)+"-test.json", JSON.stringify(labBinSet.bins, null, 2));
    }
}

