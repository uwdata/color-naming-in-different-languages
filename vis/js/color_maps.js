
$(document).on('ready page:load', function () {
  $.getJSON("../model/lab_bins.json", function( lab_bins ) {
  $.getJSON("../model/full_color_map_saliency_bins.json", function( saliencies ) {
    console.log(saliencies);

    const color_name_unselected = "----"

    /*************** Pre-processing *********************/
    lab_bins_array = []
    for(const [l_bin, l_bin_entries] of Object.entries(lab_bins)){
      for(const [a_bin, a_bin_entries] of Object.entries(l_bin_entries)){
        for(const [b_bin, b_bin_entry] of Object.entries(a_bin_entries)){
          lab_bins_array.push(b_bin_entry)
        }
      }
    }
    console.log(lab_bins_array);

    const languages = [...new Set(saliencies.map(s => s.lang))];
    console.log(languages)

    const saliencies_by_lang = {};
    languages.forEach(lang => {
      saliencies_by_lang[lang] = saliencies.filter(s => s.lang == lang)
    })

    const color_names_by_lang = {}
    languages.forEach(lang => {
      const color_names_counts = {}
      const color_name_avg_term_colors = {}
      saliencies_by_lang[lang].map(s => ({colorName: s.commonTerm, avgTermColor: s.avgTermColor}))
          .forEach(colorData => {
            if(!(colorData.colorName in color_names_counts)){
              color_names_counts[colorData.colorName] = 0
              color_name_avg_term_colors[colorData.colorName] = colorData.avgTermColor
            }
            color_names_counts[colorData.colorName]++
          })
      color_names_by_lang[lang] = []
      for(const [colorName, colorCount] of Object.entries(color_names_counts)){
        color_names_by_lang[lang].push({
          colorName: colorName,
          avgTermColor: color_name_avg_term_colors[colorName],
          count: colorCount
        })
      }
      color_names_by_lang[lang].sort((a, b) => b.count - a.count)
      color_names_by_lang[lang].unshift(
        {colorName: color_name_unselected, avgTermColor: "white",count: 0})
    })

    const MIN_BINS_DISPLAY = 700
    const MIN_BINS_HIDE = 300
    let language_stats = languages
      .map(lang => {
        return {lang: lang, numBins: saliencies_by_lang[lang].length}
      })
      

    language_stats = language_stats
      .filter(lang_stat => lang_stat.numBins > MIN_BINS_HIDE)
      .sort((a,b) => a.numBins > b.numBins)

    const allColorsName = "All Color Bins (Reference)"
    language_stats.unshift({lang: allColorsName, numBins: lab_bins_array.length})
    saliencies_by_lang[allColorsName] = lab_bins_array
    // make fields in lab_bins_array match what graph expects
    lab_bins_array.forEach(tile => {
      tile.maxpTC = 0.5
      tile.saliency = -2.5
      tile.binL = tile.l_bin
      tile.binA = tile.a_bin
      tile.binB = tile.b_bin
      tile.avgTermColor = `rgb(${tile.representative_rgb.r},${tile.representative_rgb.g},${tile.representative_rgb.b})`
    })

    const lang_color_selections = language_stats.map(a => ({selection_type: "none"}))

    console.log(language_stats)

    /*************** Create Display *********************/

    let backgroundColor = 'white'
    let tile_size_type = $("#tile_size").val()

    // since bins are unevenly distributed, this makes the L levels
    // spaced evenly on the x axis
    const L_OFFSETS = [0, 50, 110, 185, 270, 365, 465, 575, 675, 770, 820]
    
    //let margin = {top: 30, right: 50, bottom: 30, left: 50},
    let margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = 870,//$('#vis').width() - margin.left - margin.right,
      height = 125//Math.min(800 - margin.top - margin.bottom, width/4);
        
    $("#main").append(`
      <div class="row" id="vis" 
        style="min-width:${width}px; max-width:${width}px;"></div>`)

    // add space for each language
    for(let i = 0; i < language_stats.length; i++){
      const language_stat = language_stats[i]

      
      d3.select('#vis').append("div").attr("id", "lang"+i)

      createOrRefreshLang(i)
    }

    function createOrRefreshAllLangs(){
      for(let i = 0; i < language_stats.length; i++){
        createOrRefreshLang(i)
      }
    }

    function createOrRefreshLang(i){
      const language_stat = language_stats[i]
      const sal = saliencies_by_lang[language_stat.lang]

      const div = d3.select("#lang"+i)
      // don't create if language displays if they aren't selected
      if(language_stat.lang == allColorsName){
        if(!$("#ref_bins").is(':checked')){
          div.style("display", "none")
          return
        }
      } else if(!$("#low-data").is(':checked') && language_stat.numBins <= MIN_BINS_DISPLAY){
        div.style("display", "none")
        return
      }

      // show div
      div.style("display", "")

      let svg = d3.select("#lang"+i+" svg")
      if(svg.empty()){
        // first add the color name dropdown:
        if(language_stat.lang != allColorsName){
          $("#lang"+i).append(`
            <div class="form-check form-check-inline justify-content-center small" style="width:100%;margin-top:10px;"> 
              <label class="form-label" for="selected_color_${i}" style="margin-bottom: 0px">Selected Color</label>
              <select class="form-select" type="checkbox" name="metric" id="selected_color_${i}" value="selected_color_${i}">
              </select>
            </div>
            `)

          $(`#selected_color_${i}`).change(function() {
            const selection = lang_color_selections[i]
            if(this.value == color_name_unselected){
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
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
        const textBackground = svg.append("rect")
        const textBackgroundPadding = 5
        const text = svg.append("text")
          .text(language_stat.lang)
          .attr("x", 20)
          .attr("y", 25)
          //var bbox = focus.select("text").node().getBBox();
        textBackground
          .attr("fill", "white")
          .attr("x", 20 - textBackgroundPadding)
          .attr("y", 25 - textBackgroundPadding - (text.node().getBBox().height + 2*textBackgroundPadding)/2)
          .attr("width", text.node().getBBox().width + 10)
          .attr("height", text.node().getBBox().height + 10)
      }

      if(language_stat.lang != allColorsName){
        d3.select("#selected_color_"+i)
          .selectAll("option")
          .data(color_names_by_lang[language_stat.lang])
          .join("option")
            .attr("value", (d) => d.colorName)
            .html((d) => {
              let text = d.colorName
              // NOTE: to do something like this, I need to use jquery select2 or something (see color translator)
              // if(d.colorName != color_name_unselected){
              //   text = `
              //   <span style="background-color:${d.avgTermColor};padding-right: 10px;margin-right:5px;"></span>
              //   ${d.colorName}
              //   `
              // }
              return text
            })
            //<span style="background-color:rgb(81, 190, 122);padding-right: 20px;margin-right:5px;"></span>
            .property('selected', (d) => {
              const selection = lang_color_selections[i]
              if(selection.selection_type == "none"){
                if(d.colorName == color_name_unselected){
                  return true
                }
                return false
              }
              if(d.colorName == selection.color_name){
                return true
              }
              return false
            });
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
          .style("stroke-width", "1")
          .attr("x", (d) => d.binA*5 +20 + L_OFFSETS[d.binL] )
          .attr("y", (d) => {
            return -d.binB*5 + 55
          })
          .attr("fill", (d) => {
            const selection = lang_color_selections[i]
            if(selection.selection_type == "select" || selection.selection_type == "hover"){
              if(d.commonTerm == selection.color_name){
                const bin = lab_bins[d.binL][d.binA][d.binB]
                return `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
              } else {
                return backgroundColor
              }
            }

            return d.avgTermColor
            })
          .attr("height", getTileSize)
          .attr("width", getTileSize)
          .on("mouseover", (event, d) => {
            const selection = lang_color_selections[i]
            if(selection.selection_type != "select"){
              selection.selection_type = "hover"
              selection.color_name = d.commonTerm
              createOrRefreshLang(i)
            }
          })
          .on("mouseout", (event, d) => {
            const selection = lang_color_selections[i]
            if(selection.selection_type == "hover"){
              selection.selection_type = "none"
              selection.color_name = ""
              createOrRefreshLang(i)
            }
          })
          .on("click", (event, d) => {
            event.stopPropagation() // don't let svg get click and unselect it
            const selection = lang_color_selections[i]
            selection.selection_type = "select"
            selection.color_name = d.commonTerm
            createOrRefreshLang(i)
          })
      svg.on("click", (event, d) => {
            const selection = lang_color_selections[i]
            selection.selection_type = "none"
            selection.color_name = ""
            createOrRefreshLang(i)
          })
    }

    function getTileSize(d){
       if(tile_size_type == "ptc"){
          // ptc is 0 to 1
          return 10*d.maxpTC
        }
        if(tile_size_type == "sal"){
          // sal is -5 to 0
          return (d.saliency + 5)*2
        }
        // otherwise uniform:
        return 5
    }

    /********* jquery event listeners */

    $("#background-brightness").on("input", function(){
      const brightness = $(this).val() 
      const brightness255 = Math.round(255*brightness/100)
      backgroundColor = `rgb(${brightness255}, ${brightness255}, ${brightness255})`
      $("#vis").css("background-color", backgroundColor)

      createOrRefreshAllLangs()
    })

    $("#low-data").change(createOrRefreshAllLangs)
    $("#ref_bins").change(createOrRefreshAllLangs)
    $("#tile_size").change(() => {
      tile_size_type = $("#tile_size").val()
      createOrRefreshAllLangs()
    })

  })
  });
});

