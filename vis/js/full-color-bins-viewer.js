
import BinSize from "../../shared_files/binSize.js";
import FullColorBinView from "./full-color-bin-view.js";


const LAB_BIN_SIZES = [ 
  new BinSize({
    type: "box",
    l: 1/5, ab: 1/20,
    simpleName: "LAB Boxes: Low-res",
  }), 
  new BinSize({
    type: "box",
    l: 1/10, ab: 1/40, 
    simpleName: "LAB Boxes: Medium-res",
  }), 
  new BinSize({
    type: "box",
    l: 1/15, ab: 1/60,
    simpleName: "LAB Boxes: High-res",
  }), 
  new BinSize({
    type: "cube",
    l: 1/10,
    simpleName: "LAB Cubes: Low-res",
    defaultHidden: true,
  }),
  new BinSize({
    type: "cube",
    l: 1/20,
    simpleName: "LAB Cubes: Medium-res",
    defaultHidden: true,
  }),
  new BinSize({
    type: "cube",
    l: 1/40,
    simpleName: "LAB Cubes: High-res",
    defaultHidden: true,
  }), 
  new BinSize({
    type: "ring",
    l: 1/5, c: 1/20, h_divs: 8,
    simpleName: "LCH Arcs: Low-res",
    displayLABArcs: true
  }),
  new BinSize({
    type: "ring",
    l: 1/10, c: 1/40, h_divs: 8,
    simpleName: "LCH Arcs: Medium-res",
    displayLABArcs: true
  }),
  new BinSize({
    type: "ring",
    l: 1/15, c: 1/60, h_divs: 8,
    simpleName: "LCH Arcs: High-res",
    displayLABArcs: true
  }),
  new BinSize({
    type: "ring",
    l: 1/10, h_divs: 8,
    simpleName: "LCH Bins: Low-res",
  }), 
  new BinSize({
    type: "ring",
    l: 1/20, h_divs: 8,
    simpleName: "LCH Bins: Medium-res",
  }), 
  new BinSize({
    type: "ring",
    l: 1/40, h_divs: 8,
    simpleName: "LCH Bins: High-res",
  }),
  new BinSize({
    type: "ring",
    l: 1/10, h_divs: 3,
    defaultHidden: true,
  }), 
  new BinSize({
    type: "ring",
    l: 1/20, h_divs: 3,
    defaultHidden: true,
  }), 
  new BinSize({
    type: "ring",
    l: 1/40, h_divs: 3,
    defaultHidden: true,
  }),
  new BinSize({
    type: "ring",
    l: 1/5, c: 1/40, h_divs: 3,
    defaultHidden: true,
  }),
  new BinSize({
    type: "ring",
    l: 1/10, c: 1/80, h_divs: 3,
    defaultHidden: true,
  }),
  new BinSize({
    type: "ring",
    l: 1/15, c: 1/120,  h_divs: 3,
    defaultHidden: true,
  }),
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
  $("#bin_size").empty()
  let optHtmlStr = ""
  let lastCategory = ""
  for(let bin_size of LAB_BIN_SIZES){
      const thisCategory = "altDisplayCategory" in bin_size ? bin_size.altDisplayCategory : bin_size.display_category
      if(thisCategory !== lastCategory){
        if(lastCategory !== ""){
          optHtmlStr += "</optgroup>"
        }
        optHtmlStr += `<optgroup label="${thisCategory}">`
        lastCategory = thisCategory
      }
      optHtmlStr +=
        `<option value="${bin_size.abv}" ${bin_size == curr_bin_size ? 'selected' : ''} >
          ${bin_size.simpleName ? bin_size.simpleName : bin_size.display_name}
        </option>`
  }
  if(lastCategory !== ""){
    optHtmlStr += "</optgroup>"
  }
  $("#bin_size").append(optHtmlStr)

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

  d3.select("#main")
    .selectAll("#bin-description")
    .data([curr_bin_size])
    .join("p")
    .attr("id", "bin-description")
    .html((bin_size) => bin_size.simpleName ? 
      `<strong>${bin_size.simpleName}</strong> <br> ${bin_size.display_name}` : 
      `<strong>${bin_size.display_name}</strong>`)

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
    //calculate rings height:
    const ringsHeight =  currSvgSize[0].width * labBinArcViews[curr_bin_size].display_offsets.y_height_in_bins /  labBinArcViews[curr_bin_size].display_offsets.x_width_in_bins


    // move square bins down to make space for rings
    squareBins.attr("transform", `translate(0,${ringsHeight})`)
    
    svg.attr("height", currSvgSize[0].height + ringsHeight)
    

    let arcBins = svg.select("#arc-bins")
    if(arcBins.empty()){
      arcBins = svg.append("g")
        .attr("id", "arc-bins")
    }
    arcBins.attr("width", currSvgSize[0].width)
      .attr("height", ringsHeight)

    labBinArcViews[curr_bin_size].createOrUpdateColorTiles(arcBins, {backgroundColor: backgroundColor})
  } else {
    svg.select("#arc-bins").remove()
    squareBins.attr("transform", `translate(0,0)`)
  }


  // langText.text("All Color Bins")
  //     .attr("x", 20)
  //     .attr("y", 25)

  labBinViews[curr_bin_size].createOrUpdateColorTiles(squareBins, {backgroundColor: backgroundColor})
}

