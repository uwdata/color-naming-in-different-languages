
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


const labBinDataSets = {}
const labBinViews = {}
const labBinArcViews = {}
const labBin3DViews = {}

/*************** Pre-processing functions *********************/
async function load_and_process_bin_data(bin_size){
  await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    
    labBinDataSets[bin_size] = data

    const binView = new FullColorBinView({
      bin_size: bin_size,
      bin_array: data,
      x_dim: bin_size.type == "ring" ? "h" : "b",
      y_dim: bin_size.type == "ring" ? "l" : "-a",
      split_dim: bin_size.type == "ring" ? "c" : "l",
    })


    binView.setDisplayOffsets(binView.getDisplayOffsets())

    console.log("binView.display_offset", binView.display_offsets)

    labBinViews[bin_size] = binView

    const bin3dViews = new FullColorBinView({
      bin_size: bin_size,
      bin_array: data,
      x_dim: "b",
      y_dim: "-a",
      z_dim: "l",
    })

    labBin3DViews[bin_size] = bin3dViews
    bin3dViews.setDisplayOffsets(binView.getDisplayOffsets())

    if(bin_size.type == "ring"){
      const binArcView = new FullColorBinView({
        bin_size: bin_size,
        bin_array: data,
        x_dim: "b",
        y_dim: "-a",
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
let curr_color_gamut
let backgroundColor = 'white'

function getTileColor (d, bin) {
  if(curr_color_gamut == "srgb"){
    if("representative_rgb" in bin){
      return `rgb(${bin.representative_rgb.r}, ${bin.representative_rgb.g}, ${bin.representative_rgb.b})`
    } else {
      return `rgb(${bin.center_rgb.r}, ${bin.center_rgb.g}, ${bin.center_rgb.b})`
    }
  } else {
    const color_name = curr_color_gamut == "p3" ? "display-p3" : "rec2020"
    if("representative_"+curr_color_gamut in bin){
      return `color(${color_name} ${bin["representative_"+curr_color_gamut].r} ${bin["representative_"+curr_color_gamut].g} ${bin["representative_"+curr_color_gamut].b})`
    } else {
      return `color(${color_name} ${bin["center_"+curr_color_gamut].r} ${bin["center_"+curr_color_gamut].g} ${bin["center_"+curr_color_gamut].b})`
    }
  }
}

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
          ${bin_size.simpleName ? `${bin_size.simpleName} (${bin_size.abv})` : `${bin_size.display_name} (${bin_size.abv})`}
        </option>`
  }
  if(lastCategory !== ""){
    optHtmlStr += "</optgroup>"
  }
  $("#bin_size").append(optHtmlStr)

  /********* jquery event listeners */

  $("#bin_size").change(updateDisplay)

  curr_color_gamut = $("input[name='color-gamut']:checked").val()
  $("input[name='color-gamut']").change(e => {
    updateDisplay()
  })

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

  curr_color_gamut = $("input[name='color-gamut']:checked").val()
  const gamutFilteredBins = curr_bin_size.filterBinsByGamut(labBinDataSets[curr_bin_size], curr_color_gamut)
  
  labBinViews[curr_bin_size].setBinArray(gamutFilteredBins)
  labBinViews[curr_bin_size].setDisplayOffsets(labBinViews[curr_bin_size].getDisplayOffsets())
  labBin3DViews[curr_bin_size].setBinArray(gamutFilteredBins)
  labBin3DViews[curr_bin_size].setDisplayOffsets(labBinViews[curr_bin_size].getDisplayOffsets())
  if(labBinArcViews[curr_bin_size]){
    labBinArcViews[curr_bin_size].setBinArray(gamutFilteredBins)
    labBinArcViews[curr_bin_size].setDisplayOffsets(labBinArcViews[curr_bin_size].getDisplayOffsets())
  }

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

  let bins3d = svg.select("#three-d-bins")
  if(bins3d.empty()){
    bins3d = svg.append("g")
      .attr("id", "three-d-bins")
  }
  bins3d.attr("width", currSvgSize[0].width)
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

    labBinArcViews[curr_bin_size].createOrUpdateColorTiles(arcBins, {
      backgroundColor: backgroundColor,
      getTileTitleText: getTileTitleText,
      getTileColor: getTileColor
    })
  } else {
    svg.select("#arc-bins").remove()
    squareBins.attr("transform", `translate(0,0)`)
  }

  labBinViews[curr_bin_size].createOrUpdateColorTiles(squareBins, {
    backgroundColor: backgroundColor,
    getTileTitleText: getTileTitleText,
    getTileColor: getTileColor
  })

  labBin3DViews[curr_bin_size].createOrUpdateColorTiles(bins3d, {
    backgroundColor: backgroundColor,
    getTileColor: getTileColor
  })
}



function getTileTitleText(d, bin){
  let info = `
    ${curr_bin_size.type == "ring" ?
        `Bin Number: l: ${bin.l_bin}, c: ${bin.c_bin}, h: ${bin.h_bin}
        Bin Center (l, c, h): ${Math.round(bin.center_lch.l *10000, 1)/10000}, ${Math.round(bin.center_lch.c*10000, 1)/10000}, ${Math.round(bin.center_lch.h*10000, 1)/10000}` 
        :`Bin Number: l: ${bin.l_bin}, a: ${bin.a_bin}, b: ${bin.b_bin}`}
    Bin Center (l, a, b): ${Math.round(bin.center_lab.l *10000, 1)/10000}, ${Math.round(bin.center_lab.a*10000, 1)/10000}, ${Math.round(bin.center_lab.b*10000, 1)/10000}
    Bin Center (r, g, b): ${Math.round(bin.center_rgb.r, 1)}, ${Math.round(bin.center_rgb.g, 1)}, ${Math.round(bin.center_rgb.b, 1)}
    Bin percent valid rgb: ${bin.ratio_bin_in_gamut_rgb * 100}
    ${("representative_rgb" in d)
        ?
        `Example RGB in tile (r, g, b): ${bin.representative_rgb.r}, ${bin.representative_rgb.g}, ${bin.representative_rgb.b}}` 
        : ""
    }`.trim()
  return info
}

