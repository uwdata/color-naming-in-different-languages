const fs = require('fs'),
  csv = require("csvtojson"),
  Converter = require("csvtojson").Converter,
  d3 = require('d3')
  labBinHelperLib = require('./labBinHelper');

const FILE_O_LAB_BINS = "../lab_bins"

const LAB_BIN_SIZES = labBinHelperLib.LAB_BIN_SIZES

//const HUE_RATIO_LAB_DELTA = .05 // NOTE This makes it very slow
const HUE_RATIO_LAB_DELTA = .5 // For speed purposes (gives less accurate bin info)


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

// 
function getHueColorRatio(bin){
    // if no hue colors map to this bin, skip bin:
    let hueColorCount = bin.hueColorCount
    delete bin.hueColorCount
    if(hueColorCount == 0){
        //console.log("skipping bin", bin.hueColorCount)
        bin.lab_hue_color_ratio_est = 0
        return
    }

    let numHueColors = 0
    let numNonHueColors = 0
    let numOtherBinColors = 0

    // note: we'll go an extra 10% into each other bin
    // since lab values from other bins can map to rgb
    // values in this bin (is this enough? I don't know)
    let l_extra = (bin.l_max - bin.l_min) / 10
    let a_extra = (bin.a_max - bin.a_min) / 10
    let b_extra = (bin.b_max - bin.b_min) / 10

    for(let l = bin.l_min - l_extra; l <= bin.l_max + l_extra; l += HUE_RATIO_LAB_DELTA){
        for(let a = bin.a_min - a_extra; a <= bin.a_max + a_extra; a += HUE_RATIO_LAB_DELTA){
            for(let b = bin.b_min - b_extra; b <= bin.b_max + b_extra; b += HUE_RATIO_LAB_DELTA){
                const rgb = d3.lab(l,a,b).rgb()
                const rounded_rgb = {r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b)}

                //check if rgb is valid
                if(Math.max(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) > 255 || Math.min(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) < 0){
                    //console.log("invalid color, ", rounded_rgb, "from lab", [l,a,b])
                } else{ // valid rgb
                    // back-convert to LAB and make sure still in bin (since rgb's can span bins)
                    let back_lab = d3.lab(d3.rgb(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b))
                    if(back_lab.l < bin.l_min || back_lab.l > bin.l_max ||
                       back_lab.a < bin.a_min || back_lab.a > bin.a_max ||
                       back_lab.b < bin.b_min || back_lab.b > bin.b_max
                    ){
                        //console.log("color in other bin, ", rounded_rgb, "from lab", [l,a,b])
                        numOtherBinColors++
                    } else {

                        //check if rgb is hue color (at least one 255, at least one 0)
                        if(Math.max(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) == 255 && Math.min(rounded_rgb.r, rounded_rgb.g, rounded_rgb.b) == 0){
                            //console.log("hue color ", rounded_rgb, "from lab", [l,a,b])
                            numHueColors++
                        } else{
                            //console.log("non-hue color ", rounded_rgb, "from lab", [l,a,b])
                            numNonHueColors++
                        }
                    }
                }
            }
        }
    }

    bin.lab_hue_color_ratio_est = numHueColors / (numHueColors + numNonHueColors)

    console.log("bin hue ratio calculated", {
        numHueColors: numHueColors,
        numNonHueColors: numNonHueColors,
        hueColorRatio: bin.lab_hue_color_ratio_est,
        numOtherBinColors: numOtherBinColors
    } )

}

for(let labBinSize of LAB_BIN_SIZES){
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

    console.log("calculating hue color ratio per bin")
    for(const [l_bin, l_bin_entries] of Object.entries(labBinInfo).sort((a, b) => b[0] - a[0])){
        for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0])){
            for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries).sort((a, b) => b[0] - a[0])){
                getHueColorRatio(b_bin_entry)
            }
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