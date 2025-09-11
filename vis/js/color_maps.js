
$(document).on('ready page:load', function () {
  $.getJSON("../model/lab_bins.json", function( lab_bins ) {
  $.getJSON("../model/full_color_map_saliency_bins.json", function( saliencies ) {
    console.log(saliencies);

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

    const MIN_BINS_DISPLAY = 700
    const MIN_BINS_HIDE = 300
    let language_stats = languages
      .map(lang => {
        return {lang: lang, numBins: saliencies_by_lang[lang].length}
      })
      
    console.log(language_stats)

    language_stats = language_stats
      .filter(lang_stat => lang_stat.numBins > MIN_BINS_HIDE)
      .sort((a,b) => a.numBins > b.numBins)

    const allColorsName = "All Color Bins"
    language_stats.unshift({lang: allColorsName, numBins: lab_bins_array.length})
    saliencies_by_lang[allColorsName] = lab_bins_array
    // make fields in lab_bins_array match what graph expects
    lab_bins_array.forEach(tile => {
      tile.maxpTC = 0.5
      tile.binL = tile.l_bin
      tile.binA = tile.a_bin
      tile.binB = tile.b_bin
      tile.avgTermColor = `rgb(${tile.representative_rgb.r},${tile.representative_rgb.g},${tile.representative_rgb.b})`
    })

    console.log(language_stats)

    let backgroundColor = 'white'

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




    for(let i = 0; i < language_stats.length; i++){
      const language_stat = language_stats[i]

      
      d3.select('#vis').append("div").attr("id", "lang"+i)



      const svg = d3.select("#lang"+i).append("svg")
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
      let sal = saliencies_by_lang[language_stat.lang]

      drawColorTiles(i, sal)

    }
    

    $("#background-brightness").on("input", function(){
      const brightness = $(this).val() 
      const brightness255 = Math.round(255*brightness/100)
      backgroundColor = `rgb(${brightness255}, ${brightness255}, ${brightness255})`
      $("#vis").css("background-color", backgroundColor)
      for(let i = 0; i < language_stats.length; i++){
        drawColorTiles(i, saliencies_by_lang[language_stats[i].lang])
      }
      
    })

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
            if(d.highlighted){
              const bin = lab_bins[d.binL][d.binA][d.binB]
              return `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
            }
            if(d.hidden){return backgroundColor}

            return d.avgTermColor
            })
          .attr("height", (d) => 10*d.maxpTC)
          .attr("width", (d) => 10*d.maxpTC)
          .on("mouseover", (event, d) => {
            saliencies.forEach((tileInfo) => {
              if(d.commonTerm == tileInfo.commonTerm){
                tileInfo.highlighted = true;
                tileInfo.hidden = false;
              } else {
                tileInfo.highlighted = false;
                tileInfo.hidden = true;
              }
            }) 
            drawColorTiles(i, saliencies)
          })
          .on("mouseout", (event, d) => {
            saliencies.forEach((tileInfo) => {
              tileInfo.highlighted = false;
              tileInfo.hidden = false;
            }) 
            drawColorTiles(i, saliencies)
          })
    }

  })
  });
});

