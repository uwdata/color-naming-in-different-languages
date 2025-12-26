
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
    altDisplayCategory: "Oklch Bins",
  }), 
  new BinSize({
    type: "ring",
    l: 1/20, h_divs: 8,
    simpleName: "LCH Bins: Medium-res",
    altDisplayCategory: "Oklch Bins",
  }), 
  new BinSize({
    type: "ring",
    l: 1/40, h_divs: 8,
    simpleName: "LCH Bins: High-res",
    altDisplayCategory: "Oklch Bins",
  }),
  // new BinSize({
  //   type: "ring",
  //   l: 1/10, h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }), 
  // new BinSize({
  //   type: "ring",
  //   l: 1/20, h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }), 
  // new BinSize({
  //   type: "ring",
  //   l: 1/40, h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }),
  // new BinSize({
  //   type: "ring",
  //   l: 1/5, c: 1/40, h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }),
  // new BinSize({
  //   type: "ring",
  //   l: 1/10, c: 1/80, h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }),
  // new BinSize({
  //   type: "ring",
  //   l: 1/15, c: 1/120,  h_divs: 3,
  //   defaultHidden: true,
  //   altDisplayCategory: "LCH Bins - h3",
  // }),
]

const MIN_BIN_PERC_DISPLAY = 50
const MIN_BIN_PERC_HIDE = 23

const NO_BLUR = "no-blur"
const BLUR = "blur"

const COLOR_NAME_UNSELECTED = "----"

const svg_widths = {}

const saliencies = {}
const languages = {}
const saliencies_by_lang = {}
const color_names_by_lang = {}
const language_stats = {}
const lang_color_selections = {}
const lang_tile_info = {}

const labBinViews = {}
const labBinArcViews = {}
const labBin3DViews = {}

/*************** Pre-processing functions *********************/
async function load_and_process_bin_data(bin_size){
   await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    
    data = bin_size.filterBinsByGamut(data, "rgb") // assume rgb given current data
    
    const binView = new FullColorBinView({
      bin_size: bin_size,
      bin_array: data,
      x_dim: bin_size.type == "ring" ? "h" : "-b",
      y_dim: bin_size.type == "ring" ? "l" : "-a",
      split_dim: bin_size.type == "ring" ? "c" : "l",
    })


    binView.setDisplayOffsets(binView.getDisplayOffsets())

    console.log("binView.display_offset", binView.display_offsets)

    labBinViews[bin_size] = binView

    const bin3dViews = new FullColorBinView({
      bin_size: bin_size,
      bin_array: data,
      x_dim: "-b",
      y_dim: "-a",
      z_dim: "l",
    })

    labBin3DViews[bin_size] = bin3dViews
    bin3dViews.setDisplayOffsets(binView.getDisplayOffsets())

    if(bin_size.type == "ring"){
      const binArcView = new FullColorBinView({
        bin_size: bin_size,
        bin_array: data,
        x_dim: "-b",
        y_dim: "-a",
        split_dim: "l",
      })

      binArcView.setDisplayOffsets(binArcView.getDisplayOffsets())

      console.log("labBinArcViews.display_offset", binArcView.display_offsets)

      labBinArcViews[bin_size] = binArcView
    }
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
    .filter(lang_stat => (lang_stat.numBins / labBinViews[bin_size].bin_array.length) * 100  > MIN_BIN_PERC_HIDE)
    .sort((a,b) => b.numBins - a.numBins)

  
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
let curr_bin_size = LAB_BIN_SIZES.find(s => s.simpleName == "LCH Arcs: Medium-res")
let backgroundColor = 'white'
let tile_size_type = 'ptc'
let bin_size_by = "area"
let additional_tooltip_info = false

function setBinOptions(){
  const additional_bins_info = $("#additional_bins").is(':checked')
  $("#bin_size").empty()
  let optHtmlStr = ""
  let lastCategory = ""
  for(let bin_size of LAB_BIN_SIZES){
    if(!bin_size.defaultHidden || additional_bins_info){
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
  }
  if(lastCategory !== ""){
    optHtmlStr += "</optgroup>"
  }
  $("#bin_size").append(optHtmlStr)
}

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  setBinOptions()

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
  $("#both_lch_views").change(createOrRefreshAllLangs)

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
    updateDisplay()
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
  })

  $("#additional_bins").change(() => {
    setBinOptions()
  })

  updateDisplay()
})

function updateDisplay(){
  
  tile_size_type = $("#tile_size").val()
  const newBinSize =  $("#bin_size").val()

  if(newBinSize !== curr_bin_size){ 
    $('.ui-tooltip').remove(); // hack to clear ui tooltips that aren't disappearing correctly
  }
  curr_bin_size = newBinSize

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

    $('.ui-tooltip').remove(); // hack to clear ui tooltips that aren't disappearing correctly
  }

  let binView = labBinViews[curr_bin_size]
  if(curr_bin_size.displayLABArcs){
    binView = labBinArcViews[curr_bin_size]
  }

  //TODO: have maximum for height too
  currSvgSize[0].width = $("#main").width()
  currSvgSize[0].height =  currSvgSize[0].width * binView.display_offsets.y_height_in_bins /  binView.display_offsets.x_width_in_bins

  // const language_stat = language_stats[curr_bin_size][curr_blur][0]
  // currSvgSize[0].width = "binA" in saliencies_by_lang[curr_bin_size][curr_blur][language_stat.lang][0] ? 
  //   svg_widths[curr_bin_size] :
  //   1200
  // currSvgSize[0].height = svg_heights[curr_bin_size]

  $(".lang-map").each(function() {
    this.style["min-width"] = svg_widths[curr_bin_size] + 5 + "px"
  })

  d3.select("#main")
    .selectAll("#vis")
    .data(currSvgSize) // single data point, but uses d3 for updating
    .join("div")
      .attr("id", "vis")
      .attr("class", "row")
      .style("min-width", d => d.width)
      .style("max-width", d => d.height)

  // add an extra index (-1) for the reference bins
  const langIndices = [-1, ...language_stats[curr_bin_size][curr_blur].map((d, i) => i)]

  // add space for each language
  d3.select('#vis')
    .selectAll(".lang-map")
    .data(langIndices)
    .join("div")
      .attr("class", "lang-map")
      .attr("id", (i) => "lang"+i + "_" + curr_bin_size.abv.replaceAll(".", "__") + "_" + curr_blur)
      .style("min-width", currSvgSize[0].width + 5 +"px")

  createOrRefreshAllLangs()
}

function createOrRefreshAllLangs(){
  // Note: -1 will be Reference bins
  for(let i = -1; i < language_stats[curr_bin_size][curr_blur].length; i++){
    createOrRefreshLang(i)
  }
}

function createOrRefreshLang(i){
  const lang_id_str = "lang"+i + "_" + curr_bin_size.abv.replaceAll(".", "__") + "_" + curr_blur
  const div = d3.select("#"+lang_id_str)

  let binView = labBinViews[curr_bin_size]
  if(curr_bin_size.displayLABArcs){
    binView = labBinArcViews[curr_bin_size]
  }

  let bin3dView = labBin3DViews[curr_bin_size]

  let secondBinView
  if($("#both_lch_views").is(':checked') && curr_bin_size.type == "ring"){
    binView = labBinArcViews[curr_bin_size]
    secondBinView = labBinViews[curr_bin_size]
  }

  if(i == -1){ //reference bins
    if(!$("#ref_bins").is(':checked')){
      div.style("display", "none")
      return
    }
  } else {
    const language_stat = language_stats[curr_bin_size][curr_blur][i]
    // don't create if language displays if they aren't selected
    if(!$("#low-data").is(':checked') 
          && (language_stat.numBins / binView.bin_array.length) * 100  <= MIN_BIN_PERC_DISPLAY){
      div.style("display", "none")
      return
    }
  }
  

  // show div
  div.style("display", "")
  let svg = d3.select("#"+lang_id_str+" svg")

  if(svg.empty()){
    $("#"+lang_id_str).append(`<div class="container text-center" style="margin-top:10px;">
      <div class="row row-cols-auto lang-header"></div>
    </div>`)


    // first add the language label
    $("#"+lang_id_str + " .lang-header").append(`
        <div class="col">
          <strong class="lang-label"></strong> 
        </div>
        `)

    // then add the color name dropdown:
    if(i != -1){
      $("#"+lang_id_str + " .lang-header").append(`
        <div class="form-check form-check-inline justify-content-center small col"> 
          <label class="form-label" for="selected_color_${i}" style="margin-bottom: 0px">Selected Color</label>
          <select class="form-select" type="checkbox" name="metric" id="selected_color_${i}" value="selected_color_${i}" style="width:150px">
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
      $(`#${lang_id_str} #selected_color_${i}`).select2({
        templateResult: formatColorOpt,
        templateSelection: formatColorOpt,
        minimumResultsForSearch: Infinity // disable text search
      });
    }

    let langLabel = "All Color Bins (Reference)"
    if(i != -1){
      const language_stat = language_stats[curr_bin_size][curr_blur][i]
      langLabel = language_stat.lang
    }
    $("#"+lang_id_str + " .lang-label").text(langLabel)

   
    if(i != -1){
      $(`#${lang_id_str} #selected_color_${i} option`).remove()
      const language_stat = language_stats[curr_bin_size][curr_blur][i]
      const newOptions = color_names_by_lang[curr_bin_size][curr_blur][language_stat.lang].map((colorInfo) =>{
        return `<option value="${colorInfo.colorName}" data-commonColorName="${colorInfo.colorName}"
          style='background-color:${colorInfo.avgTermColor}'>
          ${colorInfo.colorName}
        </option>`
      })
       $(`#${lang_id_str} #selected_color_${i}`).append(newOptions).trigger('change');
    }   

    $(`#${lang_id_str} #selected_color_${i}`).change(function() {
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

    svg = d3.select("#"+lang_id_str).append("svg")
  }

  svg.attr("width", currSvgSize[0].width)
    .attr("height", currSvgSize[0].height)
 
  // change color of lang label
  let labelColor = "black"
  if(d3.lab(d3.color(backgroundColor)).l < 50){
    labelColor = "white"
  }
  $("#"+lang_id_str + " .lang-label").css("color", labelColor)
  $("#"+lang_id_str + " .form-label").css("color", labelColor)

  // TODO: figure out how to to make the select2 dark themed
  //$("#"+lang_id_str+ ` .selected_color_${i}`).attr("data-bs-theme", labelColor == "black"? "light" : "dark")


  if(i != -1){
    // make sure selection in dropdown is up to date:
    const selection = lang_color_selections[curr_bin_size][curr_blur][i]
    if(selection.selection_type == "none"){
      $(`#${lang_id_str} #selected_color_${i}`).val(COLOR_NAME_UNSELECTED)
      $(`#${lang_id_str} #selected_color_${i}`).trigger('change.select2')
    } else {
      $(`#${lang_id_str} #selected_color_${i}`).val(selection.color_name)
      $(`#${lang_id_str} #selected_color_${i}`).trigger('change.select2')
    }
  }

  //const binViews = secondBinView ? [binView, bin3dView, secondBinView] : [binView, bin3dView, false]
  const binViews = secondBinView ? [binView, secondBinView] : [binView, false]
  let extraHeightOffset = 0



  for(const [thisBin_i, thisBinView] of binViews.entries()){

    let binSetText = svg.select(".bin-text"+thisBin_i)
    let binGroup = svg.select(".bin-group" + thisBin_i)


    if(!thisBinView){
      binSetText.remove()
      binGroup.remove()
      return
    }

    if(binSetText.empty()){
      binSetText = svg.append("text")
        .attr("class", "bin-text"+thisBin_i)
    }

    if(binGroup.empty()){
      binGroup = svg.append("g")
        .attr("class", "bin-group" + thisBin_i) 
    }


    let binLabel = ""
    if(secondBinView){
      binLabel =  "c" in thisBinView.bin_size && [thisBinView.x_dim, thisBinView.y_dim].includes("h") ?
        "Oklch view" 
        :
        "Oklab view"
    }

    binSetText.text(binLabel)
        .attr("x", 20)
        .attr("y", binLabel ? 25 + extraHeightOffset: 0)
        .style("fill", labelColor)


    const binTextTotalHeight = binLabel ? binSetText.node().getBBox().height + 10 : 0


    const thisBinGroupHeight =  currSvgSize[0].width * thisBinView.display_offsets.y_height_in_bins /  thisBinView.display_offsets.x_width_in_bins

    binGroup.attr("width", currSvgSize[0].width)
            .attr("height", thisBinGroupHeight)


    let displayInfo
    if(i == -1){ // color reference
      displayInfo = thisBinView.createOrUpdateColorTiles(binGroup, {
        backgroundColor: backgroundColor,
        outline_levels: "c" in thisBinView.bin_size && [thisBinView.x_dim, thisBinView.y_dim].includes("h")
      })
    } else { // language color bin display
      const language_stat = language_stats[curr_bin_size][curr_blur][i]
      const sal = saliencies_by_lang[curr_bin_size][curr_blur][language_stat.lang]

      displayInfo = thisBinView.createOrUpdateColorTiles(binGroup, {
        backgroundColor: backgroundColor,
        binsToDisplay: sal,
        outline_levels: "c" in thisBinView.bin_size && [thisBinView.x_dim, thisBinView.y_dim].includes("h"),
        getTileScale: getTileScale,
        getTileColor: getTileColor,
        getTileVisible: getTileVisible,
        getTileTitleText: getTileTitleText,
        mouseover: (event, d) => {
          if(curr_bin_size in lang_color_selections && curr_blur in lang_color_selections[curr_bin_size]){
            const selection = lang_color_selections[curr_bin_size][curr_blur][i]
            if(selection.selection_type != "select"){
              selection.selection_type = "hover"
              selection.color_name = d.commonTerm
              createOrRefreshLang(i)
            }
          }
        },
        mouseout: (event, d) => {
          if(curr_bin_size in lang_color_selections && curr_blur in lang_color_selections[curr_bin_size]){
            const selection = lang_color_selections[curr_bin_size][curr_blur][i]
            if(selection.selection_type == "hover"){
              selection.selection_type = "none"
              selection.color_name = ""
              createOrRefreshLang(i)
            }
          }
        },
        click: (event, d) => {
          event.stopPropagation() // don't let svg get click and unselect it
          if(curr_bin_size in lang_color_selections && curr_blur in lang_color_selections[curr_bin_size]){
            const selection = lang_color_selections[curr_bin_size][curr_blur][i]
            selection.selection_type = "select"
            selection.color_name = d.commonTerm
            createOrRefreshLang(i)
          }
        }
      })



      function getTileColor(d, bin){
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(selection.selection_type == "select" || selection.selection_type == "hover"){
          if(d.commonTerm == selection.color_name){
            return "representative_rgb" in bin ? 
                `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
              :
                `rgb(${bin.center_rgb.r},${bin.center_rgb.g},${bin.center_rgb.b})`
          }
        }
        return d.avgTermColor
      }

      function getTileVisible(d){
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        if(selection.selection_type == "select" || selection.selection_type == "hover"){
          if(d.commonTerm == selection.color_name){
            return true
          } else {
            return false
          }
        }
        return true
      }

      svg.on("click", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][curr_blur][i]
        selection.selection_type = "none"
        selection.color_name = ""
        createOrRefreshLang(i)
      })
    }

    binGroup.attr("transform", `translate(0,${binTextTotalHeight - displayInfo.verticalMargin + extraHeightOffset})`)
    svg.attr("height", thisBinGroupHeight + binTextTotalHeight - displayInfo.verticalMargin + extraHeightOffset)
    extraHeightOffset += parseFloat(binGroup.attr("height"))
  }
}

function getTileTitleText(d, bin){
  let lchVal = ""
  if("c_center" in bin){
    lchVal = `Bin Center (l, h, c): ${bin.l_center.toPrecision(3)/1}, ${bin.h_center.toPrecision(3)/1}, ${bin.c_center.toPrecision(3)/1}
    `
  }
  let info = `
    ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
    ${lchVal}Bin Center (l, a, b): ${bin.center_lab.l.toPrecision(3)/1}, ${bin.center_lab.a.toPrecision(3)/1}, ${bin.center_lab.b.toPrecision(3)/1}
    Bin Center (r, g, b): ${Math.round(bin.center_rgb.r, 1)}, ${Math.round(bin.center_rgb.g, 1)}, ${Math.round(bin.center_rgb.b, 1)}
    ${("representative_rgb" in bin)
        ?
        `Example RGB in tile (r, g, b): ${Math.round(bin.representative_rgb.r, 1)}, ${Math.round(bin.representative_rgb.g, 1)}, ${Math.round(bin.representative_rgb.b, 1)}` 
        : ""
    }`.trim()
    //          Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
  if(additional_tooltip_info){
    info = `${info}
    Saliency: ${(-d.saliency).toPrecision(3)}
    Top Terms:`
    for(const topTerm of d.topTerms){
      const topTermPerc = topTerm.pTC != 1 ? (100*topTerm.pTC).toPrecision(2) : 100
      info+="\n  - " + topTerm.commonTerm + " (" + topTermPerc + "%)"
    }
  }
  return info
}


const tileMaxSizeMultiplier = 1.7
function getTileScale(d){
    if(tile_size_type == "ptc"){
      // ptc is 0 to 1
      if(bin_size_by == "length-width"){
        return tileMaxSizeMultiplier*d.maxpTC
      } else {
        return Math.sqrt(tileMaxSizeMultiplier*d.maxpTC)
      }
    }
    if(tile_size_type == "sal"){
      const min_sal = -6
      const sal_ratio = (d.saliency - min_sal) / -min_sal 
      const sal_smaller = 0.8
      if(bin_size_by == "length-width"){
        return sal_smaller*tileMaxSizeMultiplier*sal_ratio
      } else {
        return sal_smaller*Math.sqrt(tileMaxSizeMultiplier*sal_ratio)
      }
    }
    // otherwise uniform:
    return 1
}

