const BIN_SIZES = [20, 10, 6.67]

const MIN_BIN_PERC_DISPLAY = 50
const MIN_BIN_PERC_HIDE = 23

const TILE_SIZE = {
  20: 15,
  10: 5,
  6.67: 3.5
}

const TILE_BORDER_SIZE = {
  20: 2,
  10: 1,
  6.67: .7
}

// this times tiles_size is margin on sides and between L tile sets
const TILE_SEGMENT_MARGIN_NUM = 3

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
  await new Promise(resolve => $.getJSON(`../model/lab_bins_${bin_size}.json`, function( data ) {
    process_lab_bin_data(data, bin_size)
    resolve()
  }))
  await new Promise(resolve => $.getJSON(`../model/full_color_map_saliency_bins_${bin_size}.json`, function( data ) {
    process_saliency_bin_data(data, bin_size)
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

  l_bin_y_offsets[bin_size] = TILE_SEGMENT_MARGIN_NUM * TILE_SIZE[bin_size] + lab_bin_b_bounds[bin_size].max * TILE_SIZE[bin_size]
  svg_heights[bin_size] = l_bin_y_offsets[bin_size] - lab_bin_b_bounds[bin_size].min * TILE_SIZE[bin_size] + TILE_SEGMENT_MARGIN_NUM * TILE_SIZE[bin_size]

  // calculate l_bin_x_offsets
  //since bins are unevenly distributed, these will make the L levels spaced evenly on the x axis
  let currXOffset = TILE_SEGMENT_MARGIN_NUM * TILE_SIZE[bin_size]
  l_bin_x_offsets[bin_size] = []
  for(const [l, l_ab_bound] of l_bin_ab_bounds[bin_size].entries()){
    // adjust for negative direction
    currXOffset = currXOffset - l_ab_bound.min_a * TILE_SIZE[bin_size]

    l_bin_x_offsets[bin_size][l] = currXOffset

    // adjust for positive direction
    currXOffset = currXOffset + l_ab_bound.max_a * TILE_SIZE[bin_size] + TILE_SIZE[bin_size] + TILE_SEGMENT_MARGIN_NUM * TILE_SIZE[bin_size]
    
    // only the last one will be saved at the end, giving us total svg width
    svg_widths[bin_size] = currXOffset
  }

  console.log("lab_bins_array", bin_size, lab_bins_arrays[bin_size]);
  console.log("l_bin_ab_bounds", l_bin_ab_bounds[bin_size])
}

function process_saliency_bin_data(saliency_data, bin_size){
  saliencies[bin_size] = saliency_data

  languages[bin_size] = [...new Set(saliencies[bin_size].map(s => s.lang))];
  console.log(languages[bin_size])

  saliencies_by_lang[bin_size] = {};
  languages[bin_size].forEach(lang => {
    saliencies_by_lang[bin_size][lang] = saliencies[bin_size].filter(s => s.lang == lang)
  })

  color_names_by_lang[bin_size] = {}
  languages[bin_size].forEach(lang => {
    const color_names_counts = {}
    const color_name_avg_term_colors = {}
    saliencies_by_lang[bin_size][lang].map(s => ({colorName: s.commonTerm, avgTermColor: s.avgTermColor}))
        .forEach(colorData => {
          if(!(colorData.colorName in color_names_counts)){
            color_names_counts[colorData.colorName] = 0
            color_name_avg_term_colors[colorData.colorName] = colorData.avgTermColor
          }
          color_names_counts[colorData.colorName]++
        })
    color_names_by_lang[bin_size][lang] = []
    for(const [colorName, colorCount] of Object.entries(color_names_counts)){
      color_names_by_lang[bin_size][lang].push({
        colorName: colorName,
        avgTermColor: color_name_avg_term_colors[colorName],
        count: colorCount
      })
    }
    color_names_by_lang[bin_size][lang].sort((a, b) => b.count - a.count)
    color_names_by_lang[bin_size][lang].unshift(
      {colorName: COLOR_NAME_UNSELECTED, avgTermColor: "rgba(255, 255, 255, 0)",count: 0})
  })



  language_stats[bin_size] = languages[bin_size]
    .map(lang => {
      return {lang: lang, numBins: saliencies_by_lang[bin_size][lang].length}
    })
    

  language_stats[bin_size] = language_stats[bin_size]
    .filter(lang_stat => (lang_stat.numBins / lab_bins_arrays[bin_size].length) * 100  > MIN_BIN_PERC_HIDE)
    .sort((a,b) => b.numBins - a.numBins)

  
  language_stats[bin_size].unshift({lang: ALL_COLOR_NAME, numBins: lab_bins_arrays[bin_size].length})
  saliencies_by_lang[bin_size][ALL_COLOR_NAME] = lab_bins_arrays[bin_size]
  // make fields in lab_bins_arrays[curr_bin_size] match what graph expects
  lab_bins_arrays[bin_size].forEach(tile => {
    tile.maxpTC = 0.5
    tile.saliency = -2.5
    tile.binL = tile.l_bin
    tile.binA = tile.a_bin
    tile.binB = tile.b_bin
    tile.avgTermColor = `rgb(${tile.representative_rgb.r},${tile.representative_rgb.g},${tile.representative_rgb.b})`
  })

  lang_color_selections[bin_size] = language_stats[bin_size].map(() => ({selection_type: "none"}))
  lang_tile_info[bin_size] = language_stats[bin_size].map(() => ({}))

  console.log(language_stats[bin_size])
}

/*************** Tracking the current display options *******************/
const currSvgSize = [{}]
let curr_bin_size = BIN_SIZES[1] 
let backgroundColor = 'white'
let tile_size_type = 'ptc'
let bin_size_by = "area"

/*************** Load page and Data *********************/
$(document).on('ready page:load', function () {
  for(let bin_size of BIN_SIZES){
    $("#bin_size").append(
      `<option value="${bin_size}" ${bin_size == curr_bin_size ? 'selected' : ''} >
        ${bin_size} x ${bin_size} x ${bin_size}
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
  updateDisplay()
})

function updateDisplay(){
  
  tile_size_type = $("#tile_size").val()
  curr_bin_size = Number($("#bin_size").val())

  if(!language_stats[curr_bin_size]){
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
    .data(language_stats[curr_bin_size])
    .join("div")
      .attr("class", "lang-map")
      .attr("id", (d, i) => `lang${i}`)

  createOrRefreshAllLangs()
}

function createOrRefreshAllLangs(){
  for(let i = 0; i < language_stats[curr_bin_size].length; i++){
    createOrRefreshLang(i)
  }
}

function createOrRefreshLang(i){
  const language_stat = language_stats[curr_bin_size][i]
  const sal = saliencies_by_lang[curr_bin_size][language_stat.lang]

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
          ${color_names_by_lang[curr_bin_size][language_stat.lang].map((colorInfo) =>{
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
        const selection = lang_color_selections[curr_bin_size][i]
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
  const selection = lang_color_selections[curr_bin_size][i]
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
      .style("stroke-width", d => TILE_BORDER_SIZE[curr_bin_size])
      .attr("x", (d) => d.binA*TILE_SIZE[curr_bin_size] +l_bin_x_offsets[curr_bin_size][d.binL] )
      .attr("y", (d) => {
        return -d.binB*TILE_SIZE[curr_bin_size] + l_bin_y_offsets[curr_bin_size]
      })
      .attr("fill", (d) => {
        const selection = lang_color_selections[curr_bin_size][i]
        if(selection.selection_type == "select" || selection.selection_type == "hover"){
          if(d.commonTerm == selection.color_name){
            const bin = lab_bins[curr_bin_size][d.binL][d.binA][d.binB]
            return `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
          } else {
            return backgroundColor
          }
        }

        return d.avgTermColor
        })
      .attr("height", getTileSize)
      .attr("width", getTileSize)
      .attr("title", (d) => {
        const [l,a,b] = [d.binL, d.binA, d.binB]
        const bin_info = lab_bins[curr_bin_size][l][a][b]
        return `
          ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
          Bin Center (l, a, b): ${Math.round(bin_info.l_center, 1)}, ${Math.round(bin_info.a_center, 1)}, ${Math.round(bin_info.b_center, 1)}
          Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
          ${(bin_info.center_rgb.r != bin_info.representative_rgb.r && bin_info.center_rgb.g != bin_info.representative_rgb.g &&  bin_info.center_rgb.b != bin_info.representative_rgb.b)
              ?
              `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
              : ""
          }`.trim()
      })
      .on("mouseover", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][i]
        if(selection.selection_type != "select"){
          selection.selection_type = "hover"
          selection.color_name = d.commonTerm
          createOrRefreshLang(i)
        }
      })
      .on("mouseout", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][i]
        if(selection.selection_type == "hover"){
          selection.selection_type = "none"
          selection.color_name = ""
          createOrRefreshLang(i)
        }
      })
      .on("click", (event, d) => {
        event.stopPropagation() // don't let svg get click and unselect it
        const selection = lang_color_selections[curr_bin_size][i]
        selection.selection_type = "select"
        selection.color_name = d.commonTerm
        createOrRefreshLang(i)
      })
  svg.on("click", (event, d) => {
        const selection = lang_color_selections[curr_bin_size][i]
        selection.selection_type = "none"
        selection.color_name = ""
        createOrRefreshLang(i)
      })
}

function getTileSize(d){
    if(tile_size_type == "ptc"){
      // ptc is 0 to 1
      if(bin_size_by == "length-width"){
        return TILE_SIZE[curr_bin_size]*1.9*d.maxpTC
      } else {
        return TILE_SIZE[curr_bin_size]*1.5*Math.sqrt(d.maxpTC)
      }
    }
    if(tile_size_type == "sal"){
      let min_sal = -6
      let sal_ratio = (d.saliency - min_sal) / -min_sal 
      if(bin_size_by == "length-width"){
        return TILE_SIZE[curr_bin_size]*1.8*sal_ratio
      } else {
        return TILE_SIZE[curr_bin_size]*1.3*Math.sqrt(sal_ratio)
      }
    }
    // otherwise uniform:
    return TILE_SIZE[curr_bin_size]
}

