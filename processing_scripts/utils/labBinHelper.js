import Color from "colorjs.io";

// Note: range of OKLAB values for all color space should be 
// l: 0-1
// a/b: -0.4, 0.4

// Note: range of OKLAB values for all rgb colors is:
// l-min: 0,
// l-max: 0.9999999934735462,
// a-min: -0.23388757418790818,
// a-max: 0.27621639742350523,
// b-min: -0.3115281476783751,
// b-max: 0.19856975465179516

// -----------------
// Cube / Rectangle
// -----------------

// should be 1 bin centered at L=1 a,b=0, and 1 L=1, a,b=0
// then evenly distributed around that
// Even though this makes the bin cover non-existent colors,
// I want to capture "white" and "black"
// (note: for edges of a/b, bins will often include non-existent colors anyway)
// I also want bins to be all the same size. Best is cubes (e.g., 10x10x10)
// though for visualization, different size for L than for a/b is  better


// -----------------
// Oklch ring segment bins
// -----------------
// if we do uniform radius circles, but make start circle r=1
// (so radius = r), but consider it's full width d=2r, and make
// each level after that another 2r out
// the first ring [0] (middle circle) is pi*r^2
// the second ring [1] is pi*(3r)^2 - pi*r^2 = 8 * pi*r^2
// the third ring [2] is pi*(5r)^2 - pi*(3r)^2 = 16 * pi*r^2
// the nth ring is size: pi*((2*n+1)*r)^2 - pi*((2*(n-1) +1)*r)^2 
//                = ((2*n+1)^2 - (2*(n-1) +1)^2) * pi*r^2 
//                = ((2*n+1)^2 - (2*n-1)^2) * pi*r^2 
//                = ( 4n^2 + 4n + 1 - 4n^2 + 4n - 1) * pi*r^2
//                = (8n) * pi*r^2      ?????????????
// so the number of segments in each ring (for equal size) should be 8n:
//    (level 0: 1), 8, 16, 24, 32, ...

// if we do uniform radius circles (r), each level r, the area of
// the first ring [0] (middle circle) is pi*r^2
// the second ring [1] is pi*(2r)^2 - pi*r^2 = 3 * pi*r^2
// the third ring [2] is pi*(3r)^2 - pi*(2r)^2 = 5 * pi*r^2
// the nth ring is size: pi*(n*r)^2 - pi*((n-1)*r)^2 
//                = (n^2 - (n-1)^2) * pi*r^2 
//                = (n^2 - (n^2 - 2n + 1)) * pi*r^2
//                = (2n - 1) * pi * r^2
// so the number of segments in each ring (for equal size) should be 2n+1:
//    1, 3, 5, 7, 9, ...

// L axis bins are centered at 0, ... 1 
// c bins range from [0-cBinSize], [cBinSize-2*cBinSize], [cBinSize-3*cBinSize], etc.
//   though the center of the first bin should be 0, so centers are:
//      0, 1.5*cBinSize, 2.5*cBinSize, etc.
// h bin range from [0-hBinSize], [cBinSize-2*cBinSize], ... [ - 360]
//   note: hBinSize depends on what c level


const MIN_L = 0
const MAX_L = 1 
// 0.4 should be the max abs() a or b value for any visible color value
// we go past this just ot be on the safe side
const MIN_MAX_AB = 0.5

const MIN_C = 0
const MAX_C = MIN_MAX_AB
const MIN_H = 0
const MAX_H = 360


class BinSize {
  constructor(options) {
    this.l = options.l;
    this.type = options.type;
    if(this.type == "cube"){
      this.ab = this.l
      this.abv = options.l.toPrecision(2) / 1
      this.dims = ["l", "a", "b"]
    } else if(this.type == "box") {
      this.ab = options.ab;
      this.abv = options.l.toPrecision(2) / 1 + "_" + options.ab.toPrecision(2) / 1
      this.dims = ["l", "a", "b"]
    } else if(this.type == "ring") {
      this.c = options.l/2; // should it be diameter 1 * L (slightly smaller than a 1x1x1 box)
      //this.start_angle = options.start_angle ? start_angle : 0; //assume 0 for now
      this.abv = "ring_" + options.l.toPrecision(2) / 1
      this.dims = ["l", "c", "h"]
    }
    
  }

  toString() {
    return this.abv
  }
}

const LAB_BIN_SIZES = [ 
  new BinSize({
    type: "cube",
    l: 1/10}), 
  new BinSize({
    type: "cube",
    l: 1/40}),
  new BinSize({
    type: "box",
    l: 1/5, 
    ab: 1/20}),
  new BinSize({
    type: "box",
    l: 1/10, 
    ab: 1/40}), 
  new BinSize({
    type: "box",
    l: 1/15, 
    ab: 1/60}),
  new BinSize({
    type: "ring",
    l: 1/10,
    //start_angle: 0 // assume 0 for now
  }),
  new BinSize({
    type: "ring",
    l: 1/20,
    //start_angle: 0 // assume 0 for now
  }),
  new BinSize({
    type: "ring",
    l: 1/40,
    //start_angle: 0 // assume 0 for now
  })
]

function getLabBins(binSizeInfo){

  const BIN_L_N = (MAX_L - MIN_L) / binSizeInfo.l + 1 // +1 so the bin centers are at 0 and at 100
  if(BIN_L_N != Math.floor(BIN_L_N)){
    throw new Error("Error: Bin size must be evenly divisible by 100 to make bins line up with 0 and 100")
  }

  if(binSizeInfo.type == "cube" || binSizeInfo.type == "box"){
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

    function createLabBinInfo(l_bin, a_bin, b_bin){
      const l_bin_center = MIN_L + l_bin * binSizeInfo.l
      const l_bin_min = l_bin_center - binSizeInfo.l/2
      const l_bin_max = l_bin_center + binSizeInfo.l/2

      const a_bin_center = a_bin * binSizeInfo.ab
      const a_bin_min = a_bin_center - binSizeInfo.ab/2
      const a_bin_max = a_bin_center + binSizeInfo.ab/2

      const b_bin_center = b_bin * binSizeInfo.ab
      const b_bin_min = b_bin_center - binSizeInfo.ab/2
      const b_bin_max = b_bin_center + binSizeInfo.ab/2

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
      return binInfo
    }

    return {
      "BIN_L_N": BIN_L_N,
      "BIN_AB_N": BIN_AB_N,
      "MIN_L": MIN_L,
      "bins_from_lab": bins_from_lab,
      "lab_from_bins": lab_from_bins,
      "createLABNumBins": createLABNumBins,
      "labBinsToArray": labBinsToArray,
      "createLabBinInfo": createLabBinInfo
    }
  } else if(binSizeInfo.type == "ring") {
    const BIN_C_N = Math.ceil(MAX_C / binSizeInfo.c) // ceil to make a whole number big enough, 

    function hueToRange(h){
      if(isNaN(h)){
        return 0
      }
      while(h < 0){
        h += 360
      }
      while(h > 360){
        h -= 360
      }
      return h
    }


    function bins_from_lch(lch){
        const l_bin = Math.round(lch.l / binSizeInfo.l)

        const c_bin = Math.floor(lch.c / binSizeInfo.c)

        const hue_bin_num = 2*c_bin + 1 // number of hue bins is 2*c_bin + 1 (math above)
        const hue_bin_size = MAX_H / hue_bin_num
        const h_bin = Math.floor(hueToRange(lch.h) / hue_bin_size)

        return [l_bin, c_bin, h_bin]
    }

    function lch_from_bins(bins_l, bins_c, bins_h){
      // bins_l is midpoint
      const l = binSizeInfo.l * bins_l
      
      // bins_c is start point (so mid is half way through bin), except 0, which is centered at 0
      const c = bins_c == 0 ? 0: binSizeInfo.c * (bins_c + 0.5) 

      const hue_bin_num = 2*c_bin + 1 // number of hue bins is 2*c_bin + 1 (math above)
      const hue_bin_size = MAX_H / hue_bin_num
      const h = hue_bin_size * (bins_h + 0.5)

      return[l, c, h]
    }

    /**
     * 
     * @param {lab bin info (as nested objects referenced like lab_bins[l][c][h])} lch_bins 
     * @returns an array of the lch bin info objects as a single array (sorted, so it is deterministic)
     */
    function lchBinsToArray(lch_bins){
      const labBinsArr = []
      for(const [l_bin, l_bin_entries] of Object.entries(lch_bins).sort((a, b) => b[0] - a[0])){
        for(const [c_bin, c_bin_entries] of Object.entries(l_bin_entries).sort((a, b) => b[0] - a[0])){
          for(const [h_bin, h_bin_entry] of Object.entries(c_bin_entries).sort((a, b) => b[0] - a[0])){
            labBinsArr.push(h_bin_entry)
          }
        }
      }
      return labBinsArr;
    }

    function createLCHNumBins(lch_bins_example_struct){
      const newBins = {}
      for(const [l_bin, l_bin_entries] of Object.entries(lch_bins_example_struct)){
        newBins[l_bin] = {}
        for(const [c_bin, c_bin_entries] of Object.entries(l_bin_entries)){
          newBins[l_bin][c_bin] = {}
          for(const [h_bin, h_bin_entry] of Object.entries(c_bin_entries)){
            newBins[l_bin][c_bin][h_bin] = 0
          }
        }
      }
      return newBins;
    }

    function createLchBinInfo(l_bin, c_bin, h_bin){
      const l_bin_center = MIN_L + l_bin * binSizeInfo.l
      const l_bin_min = l_bin_center - binSizeInfo.l/2
      const l_bin_max = l_bin_center + binSizeInfo.l/2

      const c_bin_min = c_bin * binSizeInfo.c
      const c_bin_max = (c_bin + 1) * binSizeInfo.c
      const c_bin_center = c_bin == 0 ? 0 : (c_bin_min + c_bin_max) / 2

      const hue_bin_num = 2*c_bin + 1 // number of hue bins is 2*c_bin + 1 (math in labBinHelper)
      const hue_bin_size = MAX_H / hue_bin_num

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
      return binInfo
    }

    return {
      "BIN_L_N": BIN_L_N,
      "BIN_C_N": BIN_C_N,
      "MIN_L": MIN_L,
      "MAX_H": MAX_H,
      "bins_from_lch": bins_from_lch,
      "lch_from_bins": lch_from_bins,
      "createLABNumBins": createLCHNumBins,
      "labBinsToArray": lchBinsToArray,
      "createLchBinInfo": createLchBinInfo
    }
  } else {
    console.log("unexpected bin type", binSizeInfo)
    throw new Error("unexpected bin type", binSizeInfo)
  }

}

export { 
  getLabBins,
  LAB_BIN_SIZES, 
  MIN_L, MAX_L, MIN_MAX_AB, MIN_C, MAX_C, MIN_H, MAX_H
};

