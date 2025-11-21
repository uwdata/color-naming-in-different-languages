
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
    simpleName: "LCH Bins: High-res",
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
    tileMaxSizeMultiplier: 1.7,
    defaultHidden: true,
  }),
  
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

/*************** Pre-processing functions *********************/
async function load_and_process_bin_data(bin_size){
   await new Promise(resolve => $.getJSON(`../model/color_info_pre_naming/oklab_bins_${bin_size}.json`, function( data ) {
    
    data = data.filter(d => d.num_rgb > 0)
    
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
let curr_bin_size = LAB_BIN_SIZES[1] 
let backgroundColor = 'white'
let tile_size_type = 'ptc'
let bin_size_by = "area"
let additional_tooltip_info = false

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  for(let bin_size of LAB_BIN_SIZES){
    if(!bin_size.defaultHidden){
      $("#bin_size").append(
        `<option value="${bin_size.abv}" ${bin_size == curr_bin_size ? 'selected' : ''} >
          ${bin_size.simpleName}
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

  // add space for color reference
  d3.select('#vis')
    .append("div")
    .attr("id", `lang${-1}`)
    .style("min-width", currSvgSize[0].width + 5 +"px")
  // add space for each language
  d3.select('#vis')
    .selectAll(".lang-map")
    .data(language_stats[curr_bin_size][curr_blur])
    .join("div")
      .attr("class", "lang-map")
      .attr("id", (d, i) => `lang${i}`)
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
  const div = d3.select("#lang"+i)

  let binView = labBinViews[curr_bin_size]
  if(curr_bin_size.displayLABArcs){
    binView = labBinArcViews[curr_bin_size]
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

  let svg = d3.select("#lang"+i+" svg")
  let textBackground = svg.select(".text-background")
  let langText = svg.select(".lang-text")

  if(svg.empty()){

    // first add the color name dropdown:
    if(i != -1){
      const language_stat = language_stats[curr_bin_size][curr_blur][i]
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
 


  if(i != -1){
    // make sure selection in dropdown is up to date:
    const selection = lang_color_selections[curr_bin_size][curr_blur][i]
    if(selection.selection_type == "none"){
      $(`#selected_color_${i}`).val(COLOR_NAME_UNSELECTED)
      $(`#selected_color_${i}`).trigger('change.select2')
    } else {
      $(`#selected_color_${i}`).val(selection.color_name)
      $(`#selected_color_${i}`).trigger('change.select2')
    }
  }


  let langLabel = "All Color Bins (Reference)"
  if(i != -1){
     const language_stat = language_stats[curr_bin_size][curr_blur][i]
     langLabel = language_stat.lang
  }

  langText.text(langLabel)
      .attr("x", 20)
      .attr("y", 25)

  const textBackgroundPadding = 5
  textBackground
    .attr("fill", "white")
    .attr("x", 20 - textBackgroundPadding)
    .attr("y", 25 - textBackgroundPadding - (langText.node().getBBox().height + 2*textBackgroundPadding)/2)
    .attr("width", langText.node().getBBox().width + 10)
    .attr("height", langText.node().getBBox().height + 10)

  if(i == -1){ // color reference
    binView.createOrUpdateColorTiles(svg, {
      backgroundColor: backgroundColor,
    })
    langText.text("All Color Bins (Reference)")
      .attr("x", 20)
      .attr("y", 25)
    return
  } else {
    const language_stat = language_stats[curr_bin_size][curr_blur][i]
    const sal = saliencies_by_lang[curr_bin_size][curr_blur][language_stat.lang]

    binView.createOrUpdateColorTiles(svg, {
      backgroundColor: backgroundColor,
      binsToDisplay: sal,
      getTileScale: getTileScale,
      getTileColor: getTileColor,
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
        } else {
          return backgroundColor
        }
      }

      return d.avgTermColor
    }
  }

  svg.on("click", (event, d) => {
      const selection = lang_color_selections[curr_bin_size][curr_blur][i]
      selection.selection_type = "none"
      selection.color_name = ""
      createOrRefreshLang(i)
    })
}

//       .attr("title", (d) => {
//         const [l,a,b] = "binA" in d ?
//           [d.binL, d.binA, d.binB]
//           :
//           [d.binL, d.binC, d.binH]
//         const bin_info = lab_bins[curr_bin_size][l][a][b]
//         let info = `
//           ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
//           Bin Center (l, a, b): ${Math.round(bin_info.l_center *100, 1)/100}, ${Math.round(bin_info.a_center*100, 1)/100}, ${Math.round(bin_info.b_center*100, 1)/100}
//           Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
//           ${("representative_rgb" in bin_info)
//               ?
//               `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
//               : ""
//           }`.trim()
//           //          Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
//         if(additional_tooltip_info && d.lang != ALL_COLOR_NAME){
//           info = `${info}
//           Saliency: ${(-d.saliency).toPrecision(3)}
//           Top Terms:`
//           for(const topTerm of d.topTerms){
//             const topTermPerc = topTerm.pTC != 1 ? (100*topTerm.pTC).toPrecision(2) : 100
//             info+="\n  - " + topTerm.commonTerm + " (" + topTermPerc + "%)"
//           }
//         }
//         return info
//       })


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

