// class to hold info about Oklab/Oklch bins
// See labBinHelper.js for the details and math
// behind size options

class BinSize {
  constructor(options) {
    this.l = options.l;
    this.type = options.type;
    if(this.type == "cube"){
      this.ab = this.l
      this.l_scale = 1 // cube l is same as ab
      this.abv = "" + this.l.toPrecision(2) / 1
      this.dims = ["l", "a", "b"]
      this.display_category ="Oklab Cubes",
      this.display_name = `${this.display_category}: l: ${this.l.toPrecision(2) / 1} x a: ${this.ab.toPrecision(2) / 1} x b: ${this.ab.toPrecision(2) / 1}`
    } else if(this.type == "box") {
      this.ab = options.ab;
      this.l_scale = this.l / this.ab
      this.abv = this.l.toPrecision(2) / 1 + "_" + this.ab.toPrecision(2) / 1
      this.display_category ="Oklab Boxes",
      this.display_name = `${this.display_category}: l: ${this.l.toPrecision(2) / 1} x a: ${this.ab.toPrecision(2) / 1} x b: ${this.ab.toPrecision(2) / 1}`
      this.dims = ["l", "a", "b"]
    } else if(this.type == "ring") {
      if("h_divs" in options && options.h_divs == 3){
        this.h_divs = 3
        if("c" in options){
          this.c = options.c
        }else{
          this.c = options.l/2; // should it be diameter 1 * L (slightly smaller than a 1x1x1 box)
        }
        this.l_scale = this.l / (this.c * 2) // expect c * 2 diameter to match l
        this.c_ring_width_ratio = 0.5
      }else if(!("h_divs" in options) || options.h_divs == 8){ //default value, or already 8
        this.h_divs = 8
        if("c" in options){
          this.c = options.c
        }else{
          this.c = options.l; // should it be diameter of center 1 * L (slightly smaller than a 1x1x1 box)
          // note: after center ring, the radius change width will also be L
        }
        this.l_scale = this.l / this.c // expect c diameter to match l
        this.c_ring_width_ratio = 1
      } else{
        throw new Error("h_divs must be 3 or 8, but was: " + options.h_divs)
      }
      
      const c_abv = (this.h_divs == 3 && this.c == this.l/2) || (this.h_divs == 8 && this.c == this.l) ?
            "" :
            "_"+(this.c.toPrecision(2) / 1)
      
      this.abv = "ring_" + (this.l.toPrecision(2) / 1) + c_abv + "_h" +this.h_divs

      this.display_category ="Oklch Arcs",
      this.display_name = `${this.display_category}: l: ${this.l.toPrecision(2) / 1} x c: ${this.c.toPrecision(2) / 1} x h-initial: ${this.h_divs.toPrecision(2) / 1}`

      
      this.dims = ["l", "c", "h"]
    }

    // copy over any other values
    for(const [key, val] of Object.entries(options)){
      if(!(key in this)){
        this[key] = val
      }
    }
    
  }

  // I don't think binSize is really the place to put this function
  // but it is a convenient shared location for now
  filterBinsByGamut(binArray, colorSpace){
    colorSpace = colorSpace == "srgb" ? "rgb" : colorSpace
    return binArray.filter(b => {
      // if there are colors that mapped into this bin, then keep
      if(b["num_" + colorSpace] > 0 || b[`representative_${colorSpace}_in_this_bin`]){
        return true
      }

      // if no representative color, and center value maps into this bin, then keep
      if(!("representative_"+colorSpace in b) && !b[`center_${colorSpace}_in_other_bin`]){
        return true
      }

      // one additional exception: L between 0-1, and c or a,b=0
      if(b.l_center >= 0 && b.l_center <= 1){
        if(this.type == "ring"){
          if(b.c_center == 0){
            return true
          }
        } else {
          if(b.a_center == 0 && b.b_center == 0){
            return true
          }
        }
      }

      // otherwise, get rid of it, even if ratio bin in gamut is > 0
      //    (b["ratio_bin_in_gamut_"+colorSpace] > 0 )
      // since these are bins with no colors in them due to rounding errors

      // Note: There are still sometimes internal-looking bins that are getting
      // removed due to rounding?

      return false
    })
  }

  toString() {
    return this.abv
  }
}

export default BinSize