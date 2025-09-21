const fs = require('fs'),
  csv = require("csvtojson"),
  Converter = require("csvtojson").Converter,
  d3 = require('d3')
  labBinHelperLib = require('./labBinHelper');

const FILE_O_LAB_BINS = "../lab_bins"

const labBinSizes = [20, 10, 20/3]

// This function is used to find the best RGB
// color to represent an LAB bin whose center
// is not in RGB space
function findClosestRGBToLAB(lab, rgbs){
    let min_distance = 100000
    let closest_rgb
    for(let i = 0; i < rgbs.length; i++){
        const rgb = rgbs[i]
        const rgb_lab = d3.lab(rgb)
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

for(let labBinSize of labBinSizes){
    labBinHelper = labBinHelperLib.getLabBins(labBinSize)

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
                let centerRGB = d3.lab(l_bin_center, a_bin_center, b_bin_center).rgb()
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

    //Find out which bins contain rgb colors
    console.log("Placing rgb colors")
    for(r = 0; r <=255; r++){
    r % 20 == 0 ? console.log("r", r): ""
    for(g = 0; g <= 255; g++){
        for(b = 0; b <= 255; b++){
            let lab = d3.lab(d3.color(`rgb(${r}, ${g}, ${b})`));
            let [l_bin, a_bin, b_bin] = labBinHelper.bins_from_lab(lab)
            let bin = labBinInfo[l_bin][a_bin][b_bin]
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
        }
    }
    }


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
                        const center_lab = d3.lab(bin_info.l_center, bin_info.a_center, bin_info.b_center)
                        const closest_rgb = findClosestRGBToLAB(center_lab, bin_info.rgbs)
                        bin_info.representative_rgb = {
                            r: closest_rgb.r,
                            g: closest_rgb.g,
                            b: closest_rgb.b,
                        }
                        bin_info.representative_lab = d3.lab(d3.color(`rgb(${closest_rgb.r}, ${closest_rgb.g}, ${closest_rgb.b})`))
                    }
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

    // write out the bin info
    // count size of labBins (just for curiosity)
    let totalBins = 0
    for (const [l, l_bin] of Object.entries(labBinInfo)) {
        for (const [a, a_bin] of Object.entries(l_bin)) {
            for (const [b, b_bin] of Object.entries(a_bin)) {
                totalBins++;
            }
        }
    }
    console.log("Total bins: ", totalBins)
    fs.writeFileSync(FILE_O_LAB_BINS+"_"+(Math.round((labBinSize + Number.EPSILON) * 100) / 100)+".json", JSON.stringify(labBinInfo, null, 2));
}