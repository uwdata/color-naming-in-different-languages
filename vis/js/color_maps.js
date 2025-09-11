
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



    $("#visualization").append('<div class="row" id="vis"></div>')

    let margin = {top: 30, right: 50, bottom: 30, left: 50},
        width = 1200,//$('#vis').width() - margin.left - margin.right,
        height = 400//Math.min(800 - margin.top - margin.bottom, width/4);
    
    let svg = d3.select('#vis').append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
    

    const saliencies_en = saliencies.filter((a) => a.lang.split(" ")[0]=="English" 
  ||  a.lang.split(" ")[0]=="Korean")
    const lang_positions = {
      "English": 0,
      "Korean": 1
    }

    let backgroundColor = 'white'
        
    drawColorTiles(svg, saliencies_en, lang_positions, backgroundColor)


    $("#background-brightness").on("input", function(){
      const brightness = $(this).val() 
      const brightness255 = Math.round(255*brightness/100)
      backgroundColor = `rgb(${brightness255}, ${brightness255}, ${brightness255})`
      $("#visualization svg").css("background-color", backgroundColor)
      drawColorTiles(svg, saliencies_en, lang_positions, backgroundColor)
    })
  })
});
});

function drawColorTiles(svg, saliencies, lang_positions, backgroundColor){
  svg.selectAll(".tile")
    .data(saliencies)
    .join("rect")
      .attr("class", "tile")
      .style("stroke", backgroundColor)
      .style("stroke-width", "1")
      .attr("x", (d) => d.binA*5 +100 + 100*d.binL )
      .attr("y", (d) => {
        return -d.binB*5 + 100 + lang_positions[d.lang.split(" ")[0]] * 150
      })
      .attr("fill", (d) => {
        return d.avgTermColor
        //return d3.lab(d.lab.split(",")[0], d.lab.split(",")[1], d.lab.split(",")[2]).rgb()
        //const bin = lab_bins[d.binL][d.binA][d.binB]
        //return `rgb(${bin.representative_rgb.r},${bin.representative_rgb.g},${bin.representative_rgb.b})`
        })
      .attr("height", (d) => 10*d.maxpTC)
      .attr("width", (d) => 10*d.maxpTC)
}