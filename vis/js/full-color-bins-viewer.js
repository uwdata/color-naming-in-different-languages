
import BinSize from "../../shared_files/binSize.js";
import FullColorBinView from "./full-color-bin-view.js";


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


const labBinViews = {}
const labBinArcViews = {}

/*************** Pre-processing functions *********************/
async function load_and_process_bin_data(bin_size){
  await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    const binView = new FullColorBinView({
      bin_size: bin_size,
      bin_array: data,
      x_dim: bin_size.type == "ring" ? "h" : "a",
      y_dim: bin_size.type == "ring" ? "l" : "b",
      split_dim: bin_size.type == "ring" ? "c" : "l",
    })


    binView.setDisplayOffsets(binView.getDisplayOffsets())

    console.log("binView.display_offset", binView.display_offsets)

    labBinViews[bin_size] = binView

    if(bin_size.type == "ring"){
      const binArcView = new FullColorBinView({
        bin_size: bin_size,
        bin_array: data,
        x_dim: "a",
        y_dim: "b",
        split_dim: "l",
      })

      binArcView.setDisplayOffsets(binArcView.getDisplayOffsets())

      console.log("labBinArcViews.display_offset", binArcView.display_offsets)

      labBinArcViews[bin_size] = binArcView
    }
    
    resolve()
  }))
  updateDisplay()
}

/*************** Tracking the current display options *******************/
const currSvgSize = [{}]
let curr_bin_size = LAB_BIN_SIZES[1] 
let backgroundColor = 'white'

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  for(let bin_size of LAB_BIN_SIZES){
    $("#bin_size").append(
      `<option value="${bin_size.abv}" ${bin_size == curr_bin_size ? 'selected' : ''} >
        ${
        bin_size.display_name
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
      .selectAll(".bin-map")
      .style("background-color", backgroundColor)

    createOrRefreshTiles()
  })


  updateDisplay()
})

function updateDisplay(){
  
  curr_bin_size = $("#bin_size").val()

  curr_bin_size = LAB_BIN_SIZES.find((bin) => bin.abv == curr_bin_size)

  if(!(curr_bin_size in labBinViews)){
    d3.select("#main")
      .append("p")
      .attr("id", "loading-p")
      .html("loading...")

    load_and_process_bin_data(curr_bin_size)
    return
  } else {
    $("#loading-p").remove()
  }

  // let margin = {top: 30, right: 50, bottom: 30, left: 50},
  // width = $(targetSelector).width() - margin.left - margin.right,
  // height = Math.min(200 - margin.top - margin.bottom, width/4);

  currSvgSize[0].width = $("#main").width()
  currSvgSize[0].height =  currSvgSize[0].width * labBinViews[curr_bin_size].display_offsets.y_height_in_bins /  labBinViews[curr_bin_size].display_offsets.x_width_in_bins


  $(".bin-map").each(function() {
    this.style["min-width"] = currSvgSize[0].width + 5 + "px"
  })

  d3.select("#main")
    .selectAll("#vis")
    .data(currSvgSize)
    .join("div")
      .attr("id", "vis")
      .attr("class", "row")
      .style("min-width", d => d.width)
      .style("max-width", d => d.height)

  // add space for bin-map
  d3.select('#vis')
    .append("div")
      .attr("class", "bin-map")
      .attr("id", `bin-view`)
      .style("min-width", currSvgSize[0].width + 5 +"px")

  createOrRefreshTiles()
}


function createOrRefreshTiles(){

  const div = d3.select("#bin-view")

  // show div
  div.style("display", "")

  let svg = d3.select("#bin-view"+" svg")
  let textBackground = svg.select(".text-background")
  let langText = svg.select(".lang-text")

  if(svg.empty()){

    svg = d3.select("#bin-view").append("svg")

    textBackground = svg.append("rect")
            .attr("class", "text-background")
    
    langText = svg.append("text")
      .attr("class", "lang-text")
  }

  svg.attr("width", currSvgSize[0].width)
    .attr("height", currSvgSize[0].height )

  let squareBins = svg.select("#square-bins")
  if(squareBins.empty()){
    squareBins = svg.append("g")
      .attr("id", "square-bins")
  }
  squareBins.attr("width", currSvgSize[0].width)
    .attr("height", currSvgSize[0].height )

  if(curr_bin_size.type == "ring"){
    // move square bins down to make space for rings
    squareBins.attr("transform", `translate(0,${currSvgSize[0].height})`)
    
    svg.attr("height", svg.attr("height") * 2)
    

    let arcBins = svg.select("#arc-bins")
    if(arcBins.empty()){
      arcBins = svg.append("g")
        .attr("id", "arc-bins")
    }
    arcBins.attr("width", currSvgSize[0].width)
      .attr("height", currSvgSize[0].height)

    labBinArcViews[curr_bin_size].createOrUpdateColorTiles(arcBins, backgroundColor)
  } else {
    svg.select("#arc-bins").remove()
    squareBins.attr("transform", `translate(0,0)`)
  }


  langText.text("All Color Bins")
      .attr("x", 20)
      .attr("y", 25)

  labBinViews[curr_bin_size].createOrUpdateColorTiles(squareBins, backgroundColor)
}

