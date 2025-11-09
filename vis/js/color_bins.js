class BinSize {
  constructor(options) {
    this.l = options.l;
    this.ab = options.ab;
    this.tileSize = options.tileSize;
    this.tileMaxSizeMultiplier = options.tileMaxSizeMultiplier;
    this.tileBorderSize = options.tileBorderSize;
    this.abv = options.l.toPrecision(2) / 1 + "_" + options.ab.toPrecision(2) / 1
  }

  toString() {
    return this.abv
  }
}

const LAB_BIN_SIZES = [ 
  new BinSize({
    l: 1/5, ab: 1/20, // rectangle
    tileSize: 10,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 2
  }), 
  new BinSize({
    l: 1/10, ab: 1/40, // rectangle
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    l: 1/15, ab: 1/60, // rectangle
    tileSize: 4,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }), 
  new BinSize({
    l: 1/20, ab: 1/20,  // cube
    tileSize: 5,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 1
  }),
  new BinSize({
    l: 1/40, ab: 1/40, // cube
    tileSize: 2,
    tileMaxSizeMultiplier: 1.7,
    tileBorderSize: 0.5
  }), 
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
  await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/lab_bins_${bin_size}.json`, function( data ) {
    process_lab_bin_data(data, bin_size)
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
 

  if(!(bin_size in language_stats)){
    language_stats[bin_size] = {}
  }
  language_stats[bin_size][blur] = languages[bin_size][blur] = {}

  
  language_stats[bin_size][blur].unshift({lang: ALL_COLOR_NAME, numBins: lab_bins_arrays[bin_size].length})
  saliencies_by_lang[bin_size][blur][ALL_COLOR_NAME] = lab_bins_arrays[bin_size]
  
  // mark lang as ALL_COLOR_NAME so it can be handled 
  lab_bins_arrays[bin_size].forEach(tile => {
    tile.lang = ALL_COLOR_NAME,
    tile.maxpTC = 0.5
    tile.saliency = -2.5
    tile.binL = tile.l_bin
    tile.binA = tile.a_bin
    tile.binB = tile.b_bin
    tile.avgTermColor = `rgb(${tile.representative_rgb.r},${tile.representative_rgb.g},${tile.representative_rgb.b})`
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
      `<option value="${bin_size.abv}" ${bin_size == curr_bin_size ? 'selected' : ''} >
        ${bin_size.l == bin_size.ab ? "Cube" : "Box"}: ${bin_size.l.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1}
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

    createOrRefreshTiles()
  })

  $("#low-data").change(createOrRefreshTiles)
  $("#ref_bins").change(createOrRefreshTiles)


  bin_size_by = $("#bin_size_by").val()
  $("#bin_size_by").change(() => {
    bin_size_by = $("#bin_size_by").val()
    createOrRefreshTiles()
  })

  tile_size_type = $("#tile_size").val()
  $("#tile_size").change(() => {
    tile_size_type = $("#tile_size").val()
    createOrRefreshTiles()
  })

  $("#additional_tooltip").change(() => {
    additional_tooltip_info = $("#additional_tooltip").val()
    //createOrRefreshTiles()
  })

  updateDisplay()
})

function updateDisplay(){
  
  tile_size_type = $("#tile_size").val()
  curr_bin_size = $("#bin_size").val()

  curr_bin_size = LAB_BIN_SIZES.find((bin) => bin.abv == curr_bin_size)

  lab_bins_arrays[bin_size]
  if(!lab_bins_arrays[curr_bin_size]){
    d3.select("#main")
      .append("p")
      .attr("id", "loading-p")
      .html("loading...")

    load_and_process_bin_data(curr_bin_size)
    return

  } else {
    $("#loading-p").remove()
  }

  currSvgSize[0].width = svg_widths[curr_bin_size]
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
    .append("div")
      .attr("class", "lang-map")
      .attr("id", `lang`)
      .style("min-width", svg_widths[curr_bin_size] + 5 +"px")

  createOrRefreshTiles()
}


function createOrRefreshTiles(){

  const div = d3.select("#lang")
 

  // show div
  div.style("display", "")

  let svg = d3.select("#lang"+" svg")
  let textBackground = svg.select(".text-background")
  let langText = svg.select(".lang-text")

  if(svg.empty()){

    svg = d3.select("#lang").append("svg")

    textBackground = svg.append("rect")
            .attr("class", "text-background")
    
    langText = svg.append("text")
      .attr("class", "lang-text")
  }

  svg.attr("width", currSvgSize[0].width)
    .attr("height", currSvgSize[0].height)

  langText.text("All Color Bins")
      .attr("x", 20)
      .attr("y", 25)

  drawColorTiles(lab_bins_arrays[curr_bin_size])
}

function drawColorTiles(saliencies){
  const svg = d3.select("#lang" + " svg")
  svg.selectAll(".tile")
    .data(saliencies)
    .join("rect")
      .attr("class", "tile")
      .style("stroke", backgroundColor)
      .style("stroke-width", d => curr_bin_size.tileBorderSize)
      .attr("x", (d) => d.a_bin*curr_bin_size.tileSize +l_bin_x_offsets[curr_bin_size][d.l_bin])
      .attr("y", (d) => {
        return -d.b_bin*curr_bin_size.tileSize + l_bin_y_offsets[curr_bin_size]
      })
      .attr("fill", (d) => {
            const bin = lab_bins[curr_bin_size][d.l_bin][d.a_bin][d.b_bin]

            return `oklab(${bin.l_center} ${bin.a_center} ${bin.b_center})`
            //
            // if(bin.representative_p3){
            //   //return `color(display-p3 ${bin.representative_p3.r} ${bin.representative_p3.g} ${bin.representative_p3.b})`
            // }else{
            //   return `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
            // }
        })
      .attr("height", getTileSize)
      .attr("width", getTileSize)
      .attr("title", (d) => {
        const [l,a,b] = [d.l_bin, d.a_bin, d.b_bin]
        const bin_info = lab_bins[curr_bin_size][l][a][b]
        let info = `
          ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
          Bin Center (l, a, b): ${Math.round(bin_info.l_center *100, 1)/100}, ${Math.round(bin_info.a_center*100, 1)/100}, ${Math.round(bin_info.b_center*100, 1)/100}
          Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
          Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
          ${(bin_info.center_rgb.r != bin_info.representative_rgb.r && bin_info.center_rgb.g != bin_info.representative_rgb.g &&  bin_info.center_rgb.b != bin_info.representative_rgb.b)
              ?
              `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
              : ""
          }`.trim()

        return info
      })
}

function getTileSize(d){
      return curr_bin_size.tileSize
}

