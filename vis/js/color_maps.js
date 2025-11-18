
class BinSize {
  constructor(options) {
    this.l = options.l;
    this.type = options.type;
    if(this.type == "cube"){
      this.ab = this.l
      this.abv = this.l.toPrecision(2) / 1
      this.dims = ["l", "a", "b"]
    } else if(this.type == "box") {
      this.ab = options.ab;
      this.abv = this.l.toPrecision(2) / 1 + "_" + this.ab.toPrecision(2) / 1
      this.dims = ["l", "a", "b"]
    } else if(this.type == "ring") {
      if("h_divs" in options && options.h_divs == 3){
        this.h_divs = 3
        if("c" in options){
          this.c = options.c
        }else{
          this.c = options.l/2; // should it be diameter 1 * L (slightly smaller than a 1x1x1 box)
        }
      }else if(!("h_divs" in options) || options.h_divs == 8){ //default value, or already 8
        this.h_divs = 8
        if("c" in options){
          this.c = options.c
        }else{
          this.c = options.l; // should it be diameter of center 1 * L (slightly smaller than a 1x1x1 box)
          // note: after center ring, the radius change width will also be L
        }
      } else{
        throw new Error("h_divs must be 3 or 8, but was: " + options.h_divs)
      }
      
      const c_abv = (this.h_divs == 3 && this.c == this.l/2) || (this.h_divs == 8 && this.c == this.l) ?
            "" :
            "_"+(this.c.toPrecision(2) / 1)
      
      this.abv = "ring_" + (this.l.toPrecision(2) / 1) + c_abv + "_h" +this.h_divs
      
      this.dims = ["l", "c", "h"]
    }

    // copy over any other values
    for(const [key, val] of Object.entries(options)){
      if(!(key in this)){
        this[key] = val
      }
    }
    
  }

  toString() {
    return this.abv
  }
}

// const LAB_BIN_SIZES = [ 
//   new BinSize({
//     l: 1/5, ab: 1/20, // rectangle
//     tileSize: 15,
//     tileMaxSizeMultiplier: 1.5,
//     tileBorderSize: 2
//   }), 
//   new BinSize({
//     l: 1/10, ab: 1/40, // rectangle
//     tileSize: 5,
//     tileMaxSizeMultiplier: 1.7,
//     tileBorderSize: 1
//   }), 
//   new BinSize({
//     l: 1/15, ab: 1/60, // rectangle
//     tileSize: 4,
//     tileMaxSizeMultiplier: 1.7,
//     tileBorderSize: 1
//   }), 
//   new BinSize({
//     l: 1/20, ab: 1/20,  // cube
//     tileSize: 5,
//     tileMaxSizeMultiplier: 1.7,
//     tileBorderSize: 1
//   }),
//   new BinSize({
//     l: 1/40, ab: 1/40, // cube
//     tileSize: 2,
//     tileMaxSizeMultiplier: 1.7,
//     tileBorderSize: 0.5
//   }), 
// ]

const LAB_BIN_SIZES = [ 
  new BinSize({
    type: "box",
    l: 1/5, ab: 1/20, 
    tileSize: 10,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 2
  }), 
  new BinSize({
    type: "box",
    l: 1/10, ab: 1/40, 
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "box",
    l: 1/15, ab: 1/60,
    tileSize: 4,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "cube",
    l: 1/10,
    tileSize: 10,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 2
  }),
  new BinSize({
    type: "cube",
    l: 1/20,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "cube",
    l: 1/40,
    tileSize: 2,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 0.5
  }), 
  new BinSize({
    type: "ring",
    l: 1/10,
    h_divs: 3,
    tileSize: 10,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "ring",
    l: 1/20,
    h_divs: 3,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "ring",
    l: 1/40,
    h_divs: 3,
    tileSize: 4,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/10,
    h_divs: 8,
    tileSize: 10,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "ring",
    l: 1/20,
    h_divs: 8,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    type: "ring",
    l: 1/40,
    h_divs: 8,
    tileSize: 4,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/5,
    c: 1/40, // for h_divs 3, c should be 1/2 l, but to make it a box 4 higher, we do 1/8th l
    h_divs: 3,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/10,
    c: 1/80, // for h_divs 3, c should be 1/2 l, but to make it a box 4 higher, we do 1/8th l
    h_divs: 3,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/15,
    c: 1/120, // for h_divs 3, c should be 1/2 l, but to make it a box 4x taller, we do 1/8th l
    h_divs: 3,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/5,
    c: 1/20, // for h_divs 3, c should be = l, but we make it 1/4th
    h_divs: 8,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/10,
    c: 1/40, // for h_divs 3, c should be 1/2 l, but to make it a box 4 higher, we do 1/8th l
    h_divs: 8,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    type: "ring",
    l: 1/15,
    c: 1/60, // for h_divs 3, c should be 1/2 l, but to make it a box 4 higher, we do 1/8th l
    h_divs: 8,
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  })
]

const MIN_BIN_PERC_DISPLAY = 50
const MIN_BIN_PERC_HIDE = 23

// this times tiles_size is margin on sides and between L tile sets
const TILE_SEGMENT_MARGIN_NUM = 3

const NO_BLUR = "no-blur"
const BLUR = "blur"

const COLOR_NAME_UNSELECTED = "----"
const ALL_COLOR_NAME = "All Color Bins (Reference)"

const lab_bins = {}
const lab_bins_arrays = {}
const l_bin_ab_bounds = {}
const lab_bin_b_bounds = {}
const l_bin_x_offsets = {} // since bins are unevenly distributed, these will make the L levels spaced evenly on the x axis
const l_bin_y_offsets = {} 
const svg_heights = {}
const svg_widths = {}

const saliencies = {}
const languages = {}
const saliencies_by_lang = {}
const color_names_by_lang = {}
const language_stats = {}
const lang_color_selections = {}
const lang_tile_info = {}

/*************** Pre-processing functions *********************/
async function load_and_process_bin_data(bin_size){
  await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    //temporarily turn data back into old format:
    const newData = {}
    const [dim1, dim2, dim3] = bin_size.dims
    for(const bin of data){
      // filter for only rgb bins
      if(bin.num_rgb == 0 && bin.ratio_bin_in_gamut_rgb == 0){
        continue
      }
      const dim1_bin = bin[dim1+"_bin"]
      const dim2_bin = bin[dim2+"_bin"]
      const dim3_bin = bin[dim3+"_bin"]

      if(!(dim1_bin in newData)){
        newData[dim1_bin] = {}
      }

      if(!(dim2_bin in newData[dim1_bin])){
        newData[dim1_bin][dim2_bin] = {}
      }

      newData[dim1_bin][dim2_bin][dim3_bin] = bin
    }
    process_lab_bin_data(newData, bin_size)
    resolve()
  }))
  await new Promise(resolve => $.getJSON(`../model/binned_full_colors/full_color_map_saliency_bins_${bin_size}.json`, function( data ) {
    process_saliency_bin_data(data, bin_size, NO_BLUR)
    resolve()
  }))
  await new Promise(resolve => $.getJSON(`../model/binned_full_colors/full_color_map_saliency_bins_blur_${bin_size}.json`, function( data ) {
    process_saliency_bin_data(data, bin_size, BLUR)
    resolve()
  }))
  updateDisplay()
}

function process_lab_bin_data(bin_data, bin_size){
  lab_bins[bin_size] = bin_data
  lab_bins_arrays[bin_size] = []
  l_bin_ab_bounds[bin_size] = []

  // Make an array version of all the bins, and also find bounds for each level
  for(const [l_bin_str, l_bin_entries] of Object.entries(lab_bins[bin_size])){
    l_bin = Number(l_bin_str)
    l_bin_ab_bounds[bin_size][l_bin] = {}
    for(const [a_bin_str, a_bin_entries] of Object.entries(l_bin_entries)){
      a_bin = Number(a_bin_str) 
      if(!("max_a" in l_bin_ab_bounds[bin_size][l_bin]) || a_bin > l_bin_ab_bounds[bin_size][l_bin].max_a){
        l_bin_ab_bounds[bin_size][l_bin].max_a = a_bin
      }
      if(!("min_a" in l_bin_ab_bounds[bin_size][l_bin]) || a_bin < l_bin_ab_bounds[bin_size][l_bin].min_a){
        l_bin_ab_bounds[bin_size][l_bin].min_a = a_bin
      }
      for(const [b_bin_str, b_bin_entry] of Object.entries(a_bin_entries)){
        b_bin = Number(b_bin_str) 
        if(!("max_b" in l_bin_ab_bounds[bin_size][l_bin]) || b_bin > l_bin_ab_bounds[bin_size][l_bin].max_b){
          l_bin_ab_bounds[bin_size][l_bin].max_b = b_bin
        }
        if(!("min_b" in l_bin_ab_bounds[bin_size][l_bin]) || b_bin < l_bin_ab_bounds[bin_size][l_bin].min_b){
          l_bin_ab_bounds[bin_size][l_bin].min_b = b_bin
        }

        lab_bins_arrays[bin_size].push(b_bin_entry)
      }
    }
  }

  // figure out b bounds and y offsets and svg heights
  lab_bin_b_bounds[bin_size] = {}
  lab_bin_b_bounds[bin_size].min = l_bin_ab_bounds[bin_size]
                                  .map(bound => bound.min_b)
                                  .reduce((prev, curr) => Math.min(prev, curr))
  lab_bin_b_bounds[bin_size].max = l_bin_ab_bounds[bin_size]
                                  .map(bound => bound.max_b)
                                  .reduce((prev, curr) => Math.max(prev, curr))

  l_bin_y_offsets[bin_size] = TILE_SEGMENT_MARGIN_NUM * bin_size.tileSize + lab_bin_b_bounds[bin_size].max * bin_size.tileSize
  svg_heights[bin_size] = l_bin_y_offsets[bin_size] - lab_bin_b_bounds[bin_size].min * bin_size.tileSize + TILE_SEGMENT_MARGIN_NUM * bin_size.tileSize

  // make sure height is at least 100
  if(svg_heights[bin_size] < 100){
    l_bin_y_offsets[bin_size] += (100 - svg_heights[bin_size]) * 0.75
    svg_heights[bin_size] = 100
  }
  // calculate l_bin_x_offsets
  //since bins are unevenly distributed, these will make the L levels spaced evenly on the x axis
  let currXOffset = TILE_SEGMENT_MARGIN_NUM * bin_size.tileSize
  l_bin_x_offsets[bin_size] = []
  for(const [l, l_ab_bound] of l_bin_ab_bounds[bin_size].entries()){
    // adjust for negative direction
    currXOffset = currXOffset - l_ab_bound.min_a * bin_size.tileSize

    l_bin_x_offsets[bin_size][l] = currXOffset

    // adjust for positive direction
    currXOffset = currXOffset + l_ab_bound.max_a * bin_size.tileSize + bin_size.tileSize + TILE_SEGMENT_MARGIN_NUM * bin_size.tileSize
    
    // only the last one will be saved at the end, giving us total svg width
    svg_widths[bin_size] = currXOffset
  }

  console.log("lab_bins_array", bin_size, lab_bins_arrays[bin_size]);
  console.log("l_bin_ab_bounds", l_bin_ab_bounds[bin_size])
}

function process_saliency_bin_data(saliency_data, bin_size, blur){
  if(!(bin_size in saliencies)){
    saliencies[bin_size] = {}
  }
  saliencies[bin_size][blur] = saliency_data


  if(!(bin_size in languages)){
    languages[bin_size] = {}
  }
  languages[bin_size][blur] = [...new Set(saliencies[bin_size][blur].map(s => s.lang))];
  console.log(languages[bin_size][blur])

  if(!(bin_size in saliencies_by_lang)){
    saliencies_by_lang[bin_size] = {}
  }
  saliencies_by_lang[bin_size][blur] = {};
  languages[bin_size][blur].forEach(lang => {
    saliencies_by_lang[bin_size][blur][lang] = saliencies[bin_size][blur].filter(s => s.lang == lang)
  })

  if(!(bin_size in color_names_by_lang)){
    color_names_by_lang[bin_size] = {}
  }
  color_names_by_lang[bin_size][blur] = {}
  languages[bin_size][blur].forEach(lang => {
    const color_names_counts = {}
    const color_name_avg_term_colors = {}
    saliencies_by_lang[bin_size][blur][lang].map(s => ({colorName: s.commonTerm, avgTermColor: s.avgTermColor}))
        .forEach(colorData => {
          if(!(colorData.colorName in color_names_counts)){
            color_names_counts[colorData.colorName] = 0
            color_name_avg_term_colors[colorData.colorName] = colorData.avgTermColor
          }
          color_names_counts[colorData.colorName]++
        })
    color_names_by_lang[bin_size][blur][lang] = []
    for(const [colorName, colorCount] of Object.entries(color_names_counts)){
      color_names_by_lang[bin_size][blur][lang].push({
        colorName: colorName,
        avgTermColor: color_name_avg_term_colors[colorName],
        count: colorCount
      })
    }
    color_names_by_lang[bin_size][blur][lang].sort((a, b) => b.count - a.count)
    color_names_by_lang[bin_size][blur][lang].unshift(
      {colorName: COLOR_NAME_UNSELECTED, avgTermColor: "rgba(255, 255, 255, 0)",count: 0})
  })


  if(!(bin_size in language_stats)){
    language_stats[bin_size] = {}
  }
  language_stats[bin_size][blur] = languages[bin_size][blur]
    .map(lang => {
      return {lang: lang, numBins: saliencies_by_lang[bin_size][blur][lang].length}
    })
    

  language_stats[bin_size][blur] = language_stats[bin_size][blur]
    .filter(lang_stat => (lang_stat.numBins / lab_bins_arrays[bin_size].length) * 100  > MIN_BIN_PERC_HIDE)
    .sort((a,b) => b.numBins - a.numBins)

  
  language_stats[bin_size][blur].unshift({lang: ALL_COLOR_NAME, numBins: lab_bins_arrays[bin_size].length})
  saliencies_by_lang[bin_size][blur][ALL_COLOR_NAME] = lab_bins_arrays[bin_size]
  
  // mark lang as ALL_COLOR_NAME so it can be handled 
  lab_bins_arrays[bin_size].forEach(tile => {
    tile.lang = ALL_COLOR_NAME,
    tile.maxpTC = 0.5
    tile.saliency = -2.5
    tile.binL = tile.l_bin
    if("a_bin" in tile){
      tile.binA = tile.a_bin 
      tile.binB = tile.a_bin
    } else {
      tile.binC = tile.c_bin
      tile.binH = tile.h_bin
    }
    
    tile.avgTermColor = "representative_rgb" in tile ? 
        `rgb(${tile.representative_rgb.r},${tile.representative_rgb.g},${tile.representative_rgb.b})` 
      :
        `rgb(${tile.center_rgb.r},${tile.center_rgb.g},${tile.center_rgb.b})` 

    tile.topTerms = []
  })

  if(!(bin_size in lang_color_selections)){
    lang_color_selections[bin_size] = {}
  }
  lang_color_selections[bin_size][blur] = language_stats[bin_size][blur].map(() => ({selection_type: "none"}))
  if(!(bin_size in lang_tile_info)){
    lang_tile_info[bin_size] = {}
  }
  lang_tile_info[bin_size][blur] = language_stats[bin_size][blur].map(() => ({}))

  console.log(language_stats[bin_size][blur])
}

/*************** Tracking the current display options *******************/
const currSvgSize = [{}]
let curr_blur = BLUR
let curr_bin_size = LAB_BIN_SIZES[1] 
let backgroundColor = 'white'
let tile_size_type = 'ptc'
let bin_size_by = "area"
let additional_tooltip_info = false

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  for(let bin_size of LAB_BIN_SIZES){
    $("#bin_size").append(
      `<option value="${bin_size}" ${bin_size == curr_bin_size ? 'selected' : ''} >
        ${(bin_size.type == "cube" || bin_size.type == "box") ?
          `${bin_size.type}: ${bin_size.l.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1}`
          :
          `${bin_size.type}: ${bin_size.l.toPrecision(2) / 1} h${bin_size.h_divs}`
        }
      </option>`
    )
  }

  /********* jquery event listeners */

  $("#bin_size").change(updateDisplay)

  $("#background-brightness").on("input", function(){
    const brightness = $(this).val() 
    const brightness255 = Math.round(255*brightness/100)
    backgroundColor = `rgb(${brightness255}, ${brightness255}, ${brightness255})`

    d3.select('#vis')
      .style("background-color", backgroundColor)
      .selectAll(".lang-map")
      .style("background-color", backgroundColor)

    createOrRefreshAllLangs()
  })

  $("#low-data").change(createOrRefreshAllLangs)
  $("#ref_bins").change(createOrRefreshAllLangs)

  if(curr_blur == BLUR){
    $("#blur").prop('checked', true);
  }else{
    $("#blur").prop('checked', false);
  }
  $("#blur").change(() => {
    if($("#blur").prop('checked')){
      curr_blur = BLUR
    }else{
      curr_blur = NO_BLUR
    }
    createOrRefreshAllLangs()
  })

  bin_size_by = $("#bin_size_by").val()
  $("#bin_size_by").change(() => {
    bin_size_by = $("#bin_size_by").val()
    createOrRefreshAllLangs()
  })

  tile_size_type = $("#tile_size").val()
  $("#tile_size").change(() => {
    tile_size_type = $("#tile_size").val()
    createOrRefreshAllLangs()
  })

  $("#additional_tooltip").change(() => {
    additional_tooltip_info = $("#additional_tooltip").val()
    //createOrRefreshAllLangs()
  })

  updateDisplay()
})

function updateDisplay(){
  
  tile_size_type = $("#tile_size").val()
  curr_bin_size = $("#bin_size").val()

  curr_bin_size = LAB_BIN_SIZES.find((bin) => bin.abv == curr_bin_size)

  if(!language_stats[curr_bin_size] || !language_stats[curr_bin_size][curr_blur]){
    d3.select("#main")
      .append("p")
      .attr("id", "loading-p")
      .html("loading...")

    load_and_process_bin_data(curr_bin_size)
    return

  } else {
    $("#loading-p").remove()
  }

  // tmp hack
  const language_stat = language_stats[curr_bin_size][curr_blur][0]
  currSvgSize[0].width = "binA" in saliencies_by_lang[curr_bin_size][curr_blur][language_stat.lang][0] ? 
    svg_widths[curr_bin_size] :
    1200
  currSvgSize[0].height = svg_heights[curr_bin_size]

  $(".lang-map").each(function() {
    this.style["min-width"] = svg_widths[curr_bin_size] + 5 + "px"
  })

  d3.select("#main")
    .selectAll("#vis")
    .data(currSvgSize)
    .join("div")
      .attr("id", "vis")
      .attr("class", "row")
      .style("min-width", d => d.width)
      .style("max-width", d => d.height)

  // add space for each language
  d3.select('#vis')
    .selectAll(".lang-map")
    .data(language_stats[curr_bin_size][curr_blur])
    .join("div")
      .attr("class", "lang-map")
      .attr("id", (d, i) => `lang${i}`)
      .style("min-width", svg_widths[curr_bin_size] + 5 +"px")

  createOrRefreshAllLangs()
}

function createOrRefreshAllLangs(){
  for(let i = 0; i < language_stats[curr_bin_size][curr_blur].length; i++){
    createOrRefreshLang(i)
  }
}

function createOrRefreshLang(i){
  const language_stat = language_stats[curr_bin_size][curr_blur][i]
  const sal = saliencies_by_lang[curr_bin_size][curr_blur][language_stat.lang]

  const div = d3.select("#lang"+i)
  // don't create if language displays if they aren't selected
  if(language_stat.lang == ALL_COLOR_NAME){
    if(!$("#ref_bins").is(':checked')){
      div.style("display", "none")
      return
    }
  } else if(!$("#low-data").is(':checked') 
        && (language_stat.numBins / lab_bins_arrays[curr_bin_size].length) * 100  <= MIN_BIN_PERC_DISPLAY){
    div.style("display", "none")
    return
  }

  // show div
  div.style("display", "")

  let svg = d3.select("#lang"+i+" svg")
  let textBackground = svg.select(".text-background")
  let langText = svg.select(".lang-text")

  if(svg.empty()){

    // first add the color name dropdown:
    if(language_stat.lang != ALL_COLOR_NAME){
      $("#lang"+i).append(`
        <div class="form-check form-check-inline justify-content-center small" style="width:100%;margin-top:10px;"> 
          <label class="form-label" for="selected_color_${i}" style="margin-bottom: 0px">Selected Color</label>
          <select class="form-select" type="checkbox" name="metric" id="selected_color_${i}" value="selected_color_${i}" style="width:150px">
          ${color_names_by_lang[curr_bin_size][curr_blur][language_stat.lang].map((colorInfo) =>{
            return `<option value="${colorInfo.colorName}" data-commonColorName="${colorInfo.colorName}"
              style='background-color:${colorInfo.avgTermColor}'>
              ${colorInfo.colorName}
            </option>`
          })}
          </select>
        </div>
        `)

      // format the color dropdown as a jquery select2 box
      function formatColorOpt (colorOpt) {
        if (!colorOpt.id) { //handles loading
          return colorOpt.text;
        }        
        var $colorOpt = $(`<span class="small">
          <span style="background-color: ${colorOpt.element.style.backgroundColor};
            padding-right: 20px;margin-right:5px;"></span>
          ${colorOpt.element.attributes["data-commonColorName"].value}</span>`
        );
        return $colorOpt;
      };
      $(`#selected_color_${i}`).select2({
        templateResult: formatColorOpt,
        templateSelection: formatColorOpt,
        minimumResultsForSearch: Infinity // disable text search
      });

      $(`#selected_color_${i}`).change(function() {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(this.value == COLOR_NAME_UNSELECTED){
          selection.selection_type = "none"
          selection.color_name = ""
        }else{
          selection.selection_type = "select"
          selection.color_name = this.value
        }
        createOrRefreshLang(i)
      })
    }

    svg = d3.select("#lang"+i).append("svg")

    textBackground = svg.append("rect")
            .attr("class", "text-background")
    
    langText = svg.append("text")
      .attr("class", "lang-text")
  }

  svg.attr("width", currSvgSize[0].width)
    .attr("height", currSvgSize[0].height)

  langText.text(language_stat.lang)
      .attr("x", 20)
      .attr("y", 25)

  const textBackgroundPadding = 5
  textBackground
    .attr("fill", "white")
    .attr("x", 20 - textBackgroundPadding)
    .attr("y", 25 - textBackgroundPadding - (langText.node().getBBox().height + 2*textBackgroundPadding)/2)
    .attr("width", langText.node().getBBox().width + 10)
    .attr("height", langText.node().getBBox().height + 10)


  // make sure selection in dropdown is up to date:
  const selection = lang_color_selections[curr_bin_size][curr_blur][i]
  if(selection.selection_type == "none"){
    $(`#selected_color_${i}`).val(COLOR_NAME_UNSELECTED)
    $(`#selected_color_${i}`).trigger('change.select2')
  } else {
    $(`#selected_color_${i}`).val(selection.color_name)
    $(`#selected_color_${i}`).trigger('change.select2')
  }

  drawColorTiles(i, sal)
}

function drawColorTiles(i, saliencies){
  const svg = d3.select("#lang"+i + " svg")
  svg.selectAll(".tile")
    .data(saliencies)
    .join("rect")
      .attr("class", "tile")
      .style("stroke", backgroundColor)
      .style("stroke-width", d => curr_bin_size.tileBorderSize)
      .attr("x", (d) => (("binA" in d ? d.binA : d.binH)*curr_bin_size.tileSize +("binA" in d ? l_bin_x_offsets[curr_bin_size][ d.binL] : 200 * d.binC)))
      .attr("y", (d) => {
        return -("binB" in d ? d.binB : d.binL)*curr_bin_size.tileSize + l_bin_y_offsets[curr_bin_size]
      })
      .attr("fill", (d) => {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(selection.selection_type == "select" || selection.selection_type == "hover"){
          if(d.commonTerm == selection.color_name){
            const bin = "binA" in d ? 
              lab_bins[curr_bin_size][d.binL][d.binA][d.binB]
              :
              lab_bins[curr_bin_size][d.binL][d.binC][d.binH]
            return "representative_rgb" in bin ? 
                `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
              :
                 `rgb(${bin.center_rgb.r},${bin.center_rgb.g},${bin.center_rgb.b})`
          } else {
            return backgroundColor
          }
        }

        return d.avgTermColor
        })
      .attr("height", getTileSize)
      .attr("width", getTileSize)
      .attr("title", (d) => {
        const [l,a,b] = "binA" in d ?
          [d.binL, d.binA, d.binB]
          :
          [d.binL, d.binC, d.binH]
        const bin_info = lab_bins[curr_bin_size][l][a][b]
        let info = `
          ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
          Bin Center (l, a, b): ${Math.round(bin_info.l_center *100, 1)/100}, ${Math.round(bin_info.a_center*100, 1)/100}, ${Math.round(bin_info.b_center*100, 1)/100}
          Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
          ${("representative_rgb" in bin_info)
              ?
              `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
              : ""
          }`.trim()
          //          Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
        if(additional_tooltip_info && d.lang != ALL_COLOR_NAME){
          info = `${info}
          Saliency: ${(-d.saliency).toPrecision(3)}
          Top Terms:`
          for(const topTerm of d.topTerms){
            const topTermPerc = topTerm.pTC != 1 ? (100*topTerm.pTC).toPrecision(2) : 100
            info+="\n  - " + topTerm.commonTerm + " (" + topTermPerc + "%)"
          }
        }
        return info
      })
      .on("mouseover", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(selection.selection_type != "select"){
          selection.selection_type = "hover"
          selection.color_name = d.commonTerm
          createOrRefreshLang(i)
        }
      })
      .on("mouseout", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(selection.selection_type == "hover"){
          selection.selection_type = "none"
          selection.color_name = ""
          createOrRefreshLang(i)
        }
      })
      .on("click", (event, d) => {
        event.stopPropagation() // don't let svg get click and unselect it
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        selection.selection_type = "select"
        selection.color_name = d.commonTerm
        createOrRefreshLang(i)
      })
  svg.on("click", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        selection.selection_type = "none"
        selection.color_name = ""
        createOrRefreshLang(i)
      })
}

function getTileSize(d){
    if(d.lang === ALL_COLOR_NAME){
      return curr_bin_size.tileSize
    }
    if(tile_size_type == "ptc"){
      // ptc is 0 to 1
      if(bin_size_by == "length-width"){
        return curr_bin_size.tileSize*curr_bin_size.tileMaxSizeMultiplier*d.maxpTC
      } else {
        return curr_bin_size.tileSize*Math.sqrt(curr_bin_size.tileMaxSizeMultiplier*d.maxpTC)
      }
    }
    if(tile_size_type == "sal"){
      const min_sal = -6
      const sal_ratio = (d.saliency - min_sal) / -min_sal 
      const sal_smaller = 0.8
      if(bin_size_by == "length-width"){
        return sal_smaller*curr_bin_size.tileSize*curr_bin_size.tileMaxSizeMultiplier*sal_ratio
      } else {
        return sal_smaller*curr_bin_size.tileSize*Math.sqrt(curr_bin_size.tileMaxSizeMultiplier*sal_ratio)
      }
    }
    // otherwise uniform:
    return curr_bin_size.tileSize
}

