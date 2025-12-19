// TODO: make animated SVG between LAB and LCH space using:
// https://css-tricks.com/guide-svg-animations-smil/
//  - <animate> values, keytimes, keysplines, and path C (Cubic Bézier curve)
//   to go from curve to lines, etc.
// to export maybe

import BinSize from "../../shared_files/binSize.js";
import FullColorBinView from "./full-color-bin-view.js";

const LAB_BIN_SIZES = [ 
   new BinSize({
    type: "cube",
    l: 1/10,
  }),
  new BinSize({
    type: "cube",
    l: 1/20,
  }),
  new BinSize({
    type: "cube",
    l: 1/40,
  }), 
  new BinSize({
    type: "ring",
    l: 1/10,
    h_divs: 8,
  }), 
  new BinSize({
    type: "ring",
    l: 1/20,
    h_divs: 8,
  }), 
  new BinSize({
    type: "ring",
    l: 1/40,
    h_divs: 8,
  }),
  new BinSize({
    type: "ring",
    l: 1/10,
    h_divs: 3,
  }), 
  new BinSize({
    type: "ring",
    l: 1/20,
    h_divs: 3,
  }), 
  new BinSize({
    type: "ring",
    l: 1/40,
    h_divs: 3,
  }),
]


const labBinViews = {}
const labBinArcViews = {}

/*************** Pre-processing functions *********************/
function cubeEquivalentBinSize(bin_size){
  return LAB_BIN_SIZES.find(b => b.l == bin_size.l)
}

async function load_and_process_bin_data(bin_size){

  await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    
    data = bin_size.filterBinsByGamut(data, "rec2020") // assume rec2020 for now
    
    
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
        split_dim: "l"
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
let tile_size_type = 'ptc'
let bin_size_by = "area"
let additional_tooltip_info = false

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  for(const bin_size of LAB_BIN_SIZES){
    if(bin_size == undefined){
      console.log("bin size undefined????")
      continue
    }
    if(bin_size.type == "ring"){
      $("#bin_size").append(
        `<option value="${bin_size.abv}" ${bin_size == curr_bin_size ? 'selected' : ''} >
          ${(bin_size.type == "cube" || bin_size.type == "box") ?
            `${bin_size.type}: ${bin_size.l.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1} x ${bin_size.ab.toPrecision(2) / 1}`
            :
            `${bin_size.type}: ${bin_size.l.toPrecision(2) / 1} x ${bin_size.c.toPrecision(2) / 1} h${bin_size.h_divs}`
          }
        
        </option>`
      )
    }
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
  
  curr_bin_size = $("#bin_size").val()

  curr_bin_size = LAB_BIN_SIZES.find((bin) => bin.abv == curr_bin_size)

  if(!(curr_bin_size in labBinViews)){
    d3.select("#main")
      .append("p")
      .attr("id", "loading-p")
      .html("loading...")

    load_and_process_bin_data(curr_bin_size)
    if(curr_bin_size.type == "ring"){
      load_and_process_bin_data(cubeEquivalentBinSize(curr_bin_size))
    }
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
    svg.attr("xmlns", "http://www.w3.org/2000/svg")

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


  const cubeBinSize = cubeEquivalentBinSize(curr_bin_size)
  let extraCubeBinHeight = 0
  if(cubeBinSize in labBinViews){
      extraCubeBinHeight =  currSvgSize[0].width * labBinViews[cubeBinSize].display_offsets.y_height_in_bins /  labBinViews[cubeBinSize].display_offsets.x_width_in_bins

    let cubeBins = svg.select("#cube-bins")
    if(cubeBins.empty()){
      cubeBins = svg.append("g")
        .attr("id", "cube-bins")
    }
    cubeBins.attr("width", currSvgSize[0].width)
      .attr("height", extraCubeBinHeight)

    labBinViews[cubeBinSize].createOrUpdateColorTiles(cubeBins, {
      backgroundColor: backgroundColor,
      no_border: true,
      outline_levels: true
    })
  
    addLabel(cubeBins, "Oklab cube bins in l,a,b space")
    

  }

  //calculate rings height:
  const ringsHeight =  currSvgSize[0].width * labBinArcViews[curr_bin_size].display_offsets.y_height_in_bins /  labBinArcViews[curr_bin_size].display_offsets.x_width_in_bins


  // move square bins down to make space for rings
  squareBins.attr("transform", `translate(0,${ringsHeight + extraCubeBinHeight})`)
  
  svg.attr("height", currSvgSize[0].height + ringsHeight + extraCubeBinHeight)
  

  let arcBins = svg.select("#arc-bins")
  if(arcBins.empty()){
    arcBins = svg.append("g")
      .attr("id", "arc-bins")
  }
  arcBins.attr("width", currSvgSize[0].width)
    .attr("height", ringsHeight)
  arcBins.attr("transform", `translate(0,${extraCubeBinHeight})`)
  

  labBinArcViews[curr_bin_size].createOrUpdateColorTiles(arcBins, {
    backgroundColor: backgroundColor,
    no_border: true,
    outline_levels: true
  })
  
  addLabel(arcBins, "Oklch bins in l,a,b space")


  // langText.text("All Color Bins")
  //     .attr("x", 20)
  //     .attr("y", 25)

  labBinViews[curr_bin_size].createOrUpdateColorTiles(squareBins, {
    backgroundColor: backgroundColor,
    no_border: true,
    outline_levels: true
  })

  addLabel(squareBins, "Oklch bins in l,c,h space")

}



function addLabel(parentElement, text){
  let textBackground = parentElement.select("#text-background")
  if(textBackground.empty()){
    textBackground = parentElement.append("rect")
          .attr("id", "text-background")
  }

  let binsLabel = parentElement.select("#bins-label")
  if(binsLabel.empty()){
    binsLabel = parentElement.append("text")
    .attr("id", "bins-label")
  }
  binsLabel
    .text(text)
    .attr("x", 20)
    .attr("y", 25)



  const textBackgroundPadding = 5
  textBackground
    .attr("fill", "white")
    .attr("x", 20 - textBackgroundPadding)
    .attr("y", 25 - textBackgroundPadding - (binsLabel.node().getBBox().height + 2*textBackgroundPadding)/2)
    .attr("width", binsLabel.node().getBBox().width + 10)
    .attr("height", binsLabel.node().getBBox().height + 10)

}