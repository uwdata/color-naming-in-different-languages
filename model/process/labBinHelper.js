// should be 1 bin centered at L=1 a,b=0, and 1 L=100, a,b=0
// then evenly distributed around that
// Even though this makes the bin cover non-existent colors,
// I want to capture "white" and "black"
// (note: for edges of a/b, bins will often include non-existent colors anyway)
// I also want bins to be cubes (e.g., 10x10x10)
const MIN_L = 0
const MAX_L = 100 
// ~110 is (max abs() a or b value for any RGB value)
const MIN_MAX_AB = 111 

const LAB_BIN_SIZES = [20, 10, 20/3]

function getLabBins(binSize = 10){

  const BIN_L_N = (MAX_L - MIN_L) / binSize + 1 // +1 so the bin centers are at 0 and at 100
  if(BIN_L_N != Math.floor(BIN_L_N)){
    throw new Error("Error: Bin size must be evenly divisible by 100 to make bins line up with 0 and 100")
  }
  const BIN_AB_N_MIN = Math.ceil((MIN_MAX_AB * 2) / binSize) // ceil to make a whole number big enough, 
  // make sure odd so white/gray/black line is centered
  const BIN_AB_N = BIN_AB_N_MIN % 2 == 0 ? BIN_AB_N_MIN + 1 : BIN_AB_N_MIN

  function bins_from_lab(lab){
      const l_bin = Math.round(lab.l / binSize)
      const a_bin = Math.round(lab.a / binSize)
      const b_bin = Math.round(lab.b / binSize)
      return [l_bin, a_bin, b_bin]
  }

  function lab_from_bins(bins_l, bins_a, bins_b){
    const l = binSize * bins_l
    const a = binSize * bins_a
    const b = binSize * bins_b
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
      for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0])){
        for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries).sort((a, b) => b[0] - a[0])){
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

  return {
    "BIN_L_N": BIN_L_N,
    "BIN_AB_N": BIN_AB_N,
    "MIN_L": MIN_L,
    "bins_from_lab": bins_from_lab,
    "lab_from_bins": lab_from_bins,
    "createLABNumBins": createLABNumBins,
    "labBinsToArray": labBinsToArray
  }

}

module.exports = {
  getLabBins: getLabBins,
  LAB_BIN_SIZES: LAB_BIN_SIZES,
  MIN_L: MIN_L,
  MAX_L: MAX_L,
  MIN_MAX_AB: MIN_MAX_AB
};

