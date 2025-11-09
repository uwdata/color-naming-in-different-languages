// Note: range of OKLAB values for all rgb colors is:
// l-min: 0,
// l-max: 0.9999999934735462,
// a-min: -0.23388757418790818,
// a-max: 0.27621639742350523,
// b-min: -0.3115281476783751,
// b-max: 0.19856975465179516

// for all color space should be 
// l: 0-1
// a/b: -0.4, 0.4

// should be 1 bin centered at L=1 a,b=0, and 1 L=1, a,b=0
// then evenly distributed around that
// Even though this makes the bin cover non-existent colors,
// I want to capture "white" and "black"
// (note: for edges of a/b, bins will often include non-existent colors anyway)
// I also want bins to be all the same size. Best is cubes (e.g., 10x10x10)
// though for visualization, other bin sizes might be better
const MIN_L = 0
const MAX_L = 1 
// 0.4 should be the max abs() a or b value for any visible color value
// we go past this just ot be on the safe side
const MIN_MAX_AB = 0.5

class BinSize {
  constructor(options) {
    this.l = options.l;
    this.ab = options.ab;
    this.abv = options.l.toPrecision(2) / 1 + "_" + options.ab.toPrecision(2) / 1
  }

  toString() {
    return this.abv
  }
}

const LAB_BIN_SIZES = [ 
  new BinSize({l: 1/20, ab: 1/20}), // cube
  new BinSize({l: 1/40, ab: 1/40}), // cube
  new BinSize({l: 1/5, ab: 1/20}), // rectangle
  new BinSize({l: 1/10, ab: 1/40}), // rectangle
  new BinSize({l: 1/15, ab: 1/60}), // rectangle
]

function getLabBins(binSizeInfo){

  const BIN_L_N = (MAX_L - MIN_L) / binSizeInfo.l + 1 // +1 so the bin centers are at 0 and at 100
  if(BIN_L_N != Math.floor(BIN_L_N)){
    throw new Error("Error: Bin size must be evenly divisible by 100 to make bins line up with 0 and 100")
  }
  const BIN_AB_N_MIN = Math.ceil((MIN_MAX_AB * 2) / binSizeInfo.ab) // ceil to make a whole number big enough, 
  // make sure odd so white/gray/black line is centered
  const BIN_AB_N = BIN_AB_N_MIN % 2 == 0 ? BIN_AB_N_MIN + 1 : BIN_AB_N_MIN

  function bins_from_lab(lab){
      const l_bin = Math.round(lab.l / binSizeInfo.l)
      const a_bin = Math.round(lab.a / binSizeInfo.ab)
      const b_bin = Math.round(lab.b / binSizeInfo.ab)
      return [l_bin, a_bin, b_bin]
  }

  function lab_from_bins(bins_l, bins_a, bins_b){
    const l = binSizeInfo.l * bins_l
    const a = binSizeInfo.ab * bins_a
    const b = binSizeInfo.ab * bins_b
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
  //LAB_BIN_SIZE_ABVS: LAB_BIN_SIZE_ABVS,
  MIN_L: MIN_L,
  MAX_L: MAX_L,
  MIN_MAX_AB: MIN_MAX_AB
};

