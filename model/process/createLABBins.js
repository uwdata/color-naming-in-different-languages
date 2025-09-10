const fs = require('fs'),
  csv = require("csvtojson"),
  Converter = require("csvtojson").Converter,
  d3 = require('d3')
  //labBinner = require('./labBinner');


// calculate LAB Range:
// const d3 = require('d3')

// let MIN_L = 10, MIN_A = 0, MIN_B = 0, MAX_L = 10, MAX_A = 0, MAX_B = 0;

// for(r = 0; r <=255; r++){
//   console.log("r", r)
//   for(g = 0; g <= 255; g++){
//     for(b = 0; b <= 255; b++){
//         let lab = d3.lab(d3.color(`rgb(${r}, ${g}, ${b})`));
//         if(lab.l < MIN_L){ MIN_L = lab.l}
//         if(lab.l > MAX_L){ MAX_L = lab.l}
//         if(lab.a < MIN_A){ MIN_A = lab.a
//         }
//         if(lab.a > MAX_A){
//           MAX_A = lab.a
//         }
//         if(lab.b < MIN_B){
//           MIN_B = lab.b
//         }
//         if(lab.b > MAX_B){
//           MAX_B = lab.b
//         }
//     }
//   }
// }
// console.log("L", MIN_L, MAX_L)
// console.log("A", MIN_A, MAX_A)
// console.log("B", MIN_B, MAX_B)

// const MIN_L = 0,
//       MIN_A = -86.1827164205346,
//       MIN_B = -107.8601617541481,
//       MAX_L = 100,
//       MAX_A = 98.23431188800397,
//       MAX_B = 94.47797505367026;


// should be 1 bin centered at L=1 a,b=0, and 1 L=100, a,b=0
// then evenly distributed around that
// Even though this makes the bin cover non-existent colors,
// I want to capture "white" and "black"
const FILE_O_LAB_BINS = "../lab_bins.json"

const BIN_L_N = 10 
const BIN_AB_N = 25 // Must be odd so white/black are centered
const MIN_L = 0
const MAX_L = 100
const MIN_MAX_AB = 107.8601617541481

const BIN_DELTA_L = (MAX_L - MIN_L) / (BIN_L_N - 1)
const BIN_DELTA_AB = (MIN_MAX_AB * 2) / (BIN_AB_N - 1)

// calculate bin info
//const binInfoArr = []
const labBinInfo = {}

for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
    const l_bin_center = MIN_L + l_bin * BIN_DELTA_L
    const l_bin_min = l_bin_center - BIN_DELTA_L/2
    const l_bin_max = l_bin_center + BIN_DELTA_L/2
    for(let a_bin = -(BIN_AB_N-1)/2; a_bin <= (BIN_AB_N-1)/2; a_bin ++){
        const a_bin_center = a_bin * BIN_DELTA_AB
        const a_bin_min = a_bin_center - BIN_DELTA_AB/2
        const a_bin_max = a_bin_center + BIN_DELTA_AB/2
        for(let b_bin = -(BIN_AB_N-1)/2; b_bin <= (BIN_AB_N-1)/2; b_bin ++){
            const b_bin_center = b_bin * BIN_DELTA_AB
            const b_bin_min = b_bin_center - BIN_DELTA_AB/2
            const b_bin_max = b_bin_center + BIN_DELTA_AB/2

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
            //binInfoArr.push(binInfo)
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

function bins_from_lab(lab){
    l_bin = Math.round(lab.l / BIN_DELTA_L)
    a_bin = Math.round(lab.a / BIN_DELTA_AB)
    b_bin = Math.round(lab.b / BIN_DELTA_AB)
    return [l_bin, a_bin, b_bin]
}

for(r = 0; r <=255; r++){
  console.log("r", r)
  for(g = 0; g <= 255; g++){
    for(b = 0; b <= 255; b++){
        let lab = d3.lab(d3.color(`rgb(${r}, ${g}, ${b})`));
        let [l_bin, a_bin, b_bin] = bins_from_lab(lab)
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

for(let l_bin = 0; l_bin < BIN_L_N; l_bin++){
    for(let a_bin = -(BIN_AB_N-1)/2; a_bin <= (BIN_AB_N-1)/2; a_bin ++){
        for(let b_bin = -(BIN_AB_N-1)/2; b_bin <= (BIN_AB_N-1)/2; b_bin ++){
            let bin_info = labBinInfo[l_bin][a_bin][b_bin]
            if(bin_info.rgbs.length == 0){
                delete labBinInfo[l_bin][a_bin][b_bin]
            }else{
                let center_rgb = bin_info.center_rgb
                bin_info.representative_rgb = center_rgb
                if(center_rgb.r > 255 || center_rgb.r < 0 ||
                    center_rgb.g > 255 || center_rgb.g < 0 ||
                    center_rgb.b > 255 || center_rgb.b < 0
                ){
                    console.log("out of range rgb center", center_rgb, bin_info)
                    const center_lab = d3.lab(bin_info.l_center, bin_info.a_center, bin_info.b_center)
                    const closest_rgb = findClosestRGBToLAB(center_lab, bin_info.rgbs)
                    bin_info.representative_rgb = {
                        r: closest_rgb.r,
                        g: closest_rgb.g,
                        b: closest_rgb.b,
                    }
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


console.log(labBinInfo)
fs.writeFileSync(FILE_O_LAB_BINS, JSON.stringify(labBinInfo, null, 2));
