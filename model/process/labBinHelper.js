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
// (note: for edges of a/b, bins will often include non-existent colors anyway)
// I also want bins to be cubes (this will be 10x10)
const BIN_L_N = 11
const BIN_AB_N = 23 // Must be odd so white/black are centered
const MIN_L = 0
const MAX_L = 100 // make it a little over 100 to try to get the brightest colors to show
//const MIN_MAX_AB = 107.8601617541481
const MIN_MAX_AB = 110 // round to make BIN_DELTA_AB = 10

const BIN_DELTA_L = (MAX_L - MIN_L) / (BIN_L_N - 1)
const BIN_DELTA_AB = (MIN_MAX_AB * 2) / (BIN_AB_N - 1)


function bins_from_lab(lab){
    const l_bin = Math.round(lab.l / BIN_DELTA_L)
    const a_bin = Math.round(lab.a / BIN_DELTA_AB)
    const b_bin = Math.round(lab.b / BIN_DELTA_AB)
    return [l_bin, a_bin, b_bin]
}

function lab_from_bins(bins_l, bins_a, bins_b){
  const l = BIN_DELTA_L * bins_l
  const a = BIN_DELTA_AB * bins_a
  const b = BIN_DELTA_AB * bins_b
  return[l, a, b]
}

/**
 * 
 * @param {lab bin info (as nested objects referenced like lab_bins[l][a][b])} lab_bins 
 * @returns an array of the lab bin info objects as a single array (sorted, so it is deterministic)
 */
function labBinsToArray(lab_bins){
  const labBinsArr = []
  for(const [l_bin, l_bin_entries] of Object.entries(lab_bins).sort((a, b) => b[0] - a[0])){
    for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0]))){
      for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries).sort((a, b) => b[0] - a[0]))){
        labBinsArr.push(b_bin_entry)
      }
    }
  }
  return labBinsArr;
}

function createLABNumBins(lab_bins_example_struct){
  const newBins = {}
  for(const [l_bin, l_bin_entries] of Object.entries(lab_bins_example_struct)){
    newBins[l_bin] = {}
    for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries)){
      newBins[l_bin][a_bin] = {}
      for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries)){
        newBins[l_bin][a_bin][b_bin] = 0
      }
    }
  }
  return newBins;
}

module.exports = {
  "BIN_L_N": BIN_L_N,
  "BIN_AB_N": BIN_AB_N,
  "MIN_L": MIN_L,
  "BIN_DELTA_L": BIN_DELTA_L,
  "BIN_DELTA_AB": BIN_DELTA_AB,
  "bins_from_lab": bins_from_lab,
  "lab_from_bins": lab_from_bins,
  "createLABNumBins": createLABNumBins,
  "labBinsToArray": labBinsToArray
};

