$(document).on('ready page:load', function () {
  let Nbin, emptyNbin;
  let rootPath = window.location.pathname.split('/').slice(0,-1).join("/");

  $.getJSON("../model/hue_color_names_aggregated.json", function( data ) {

    Nbin = data.colorSet.length;
    emptyNbin = [];
    for (let i = 0; i < Nbin; i++) {
      emptyNbin.push(0);
    }

    let langs = Object.keys(data).filter(key => key !== "colorSet").sort((a,b) => - data[a].totalCount + data[b].totalCount);
    let langsIndex =[
      "Spanish",
      "French",
      "English",
      "Portuguese",
      "Romanian",
      "Dutch",
      "Polish",
      "Persian (Farsi)",
      "Swedish",
      "Finnish",
      "German",
      "Russian",
      "Chinese",
      "Korean"
    ]; // sorted by similarity of saliency
    langs =langs.sort((a,b) => langsIndex.findIndex(d => a.indexOf(d) >=0) - langsIndex.findIndex(d => b.indexOf(d) >=0) );
    langs.forEach((lang, i) => {
      $(".container").append('<div class="row" id="vis'+i+'"></div>');
      drawLangSpec('#vis'+i, data, lang, data.colorSet);
    });
  });



  function drawLangSpec(targetSelector, data, lang, colorSet){

    let data_terms = data[lang].terms;
    let data_colors = colorSet;
    let data_color_counts = emptyNbin.slice();
    let data_line = data[lang].colorNameCount;
    let data_avgColor = data[lang].avgColor.slice();
    let stacked_area = [];
    let stacked_terms = [];
    dataProcess();
    stackedArea();
    extendTail();


    data_line = stacked_area;
    data_terms = stacked_terms;


    drawing();


    function extendTail(){
      //Repeating 0.5 times more
      data_line = data_line.map(function(colorCount){
        return colorCount.concat(colorCount.slice().splice(0,Math.round(colorCount.length/2)));
      });

      stacked_area = stacked_area.map(function(colorCount){
        return colorCount.concat(colorCount.slice().splice(0,Math.round(colorCount.length/2)));
      });


      data_colors = data_colors.concat(data_colors.slice().splice(0,Math.round(data_colors.length/2)));
    }
    function drawing(){
      let spectrumN = stacked_area[0].length;

      let margin = {top: 30, right: 50, bottom: 30, left: 50},
          width = $(targetSelector).width() - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;

      let x = d3.scaleLinear()
          .range([0, width])
          .clamp(true);

      let y = d3.scaleLinear()
          .range([height, 0]);


      x.domain([0,spectrumN]);
      y.domain([0,1]);


      let yAxis = d3.axisLeft()
          .scale(y);

      let toggle = false;

      let termDiv = $('<div class="termDiv table-center"></div>');
      termDiv.append('<div class="main-term" id="'+targetSelector.replace('#','')+'-selected-title" class="text-center">Color Name</div>');

      let termLabel = $(targetSelector).append(termDiv);
      let area = d3.area()
          .x((d, i) => x(i))
          .y0((d, i) => y(d.y0))
          .y1((d, i) => y(d.y1));

      let svg = d3.select(targetSelector).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      let title = svg.append('text')
            .attr('class','vis-title')
            .attr('x',10)
            .attr('y',-10)
            .text(lang + " (# of names : "+ data[lang].totalCount +")");

      let colorPatch = svg.selectAll(".color_patch")
          .data(data_colors)
        .enter().append("rect")
          .attr("class", "color_patch")
          .attr("x", function(d,i) { return (x(i)+x(i-1))/2; })
          .attr("y", 0)
          .attr("width", function(d,i) { return i===(spectrumN-1) ? (x(1)-x(0)) /2 : x(1)-x(0)+1; } )
          .attr("height", height+20 )
          .attr("fill", function(d){ return 'rgb(' + d.rgb.r + ',' + d.rgb.g+',' + d.rgb.b + ')';})
          .on('click',function(){
            if (toggle) {
              toggle = false;
              dehighlight();
            }
          });

      let axisTitle = 'Probability of Name, given Color';
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      svg.append('text')
          .text(axisTitle)
          .attr('y',-30)
          .attr('x', -height/2)
          .attr('transform','rotate(-90)')
          .attr('text-anchor','middle');



      avgColor = (i) => {
        let c = data_avgColor[i];
        return `rgb(${Math.floor(c.r)},${Math.floor(c.g)},${Math.floor(c.b)})`;
      };


      let term = svg.selectAll(".term")
          .data(stacked_area)
        .enter().append("g")
          .attr("class", "term");

      term.append("path")
          .attr("class", "area area1")
          .attr("d", d => area(d))
          .attr("fill", (d, i) => avgColor(i))
          .style("stroke", '#000')
          .style("opacity", 1)


      term.append("path")
          .attr("class", "fake-area")
          .attr("d", area)
          .style("fill", '#fff')
          .attr('opacity', 0)
          .on('mouseover',function(d,i){
            if (!toggle) {
              highlight(d, i);
            }
          })
          .on('mouseout', function(d){
            if (!toggle) {
              dehighlight();
            }
          }).
          on('click',function(d,i){
            if (!toggle) {
              toggle = true;
              highlight(d, i, true);
            }
            else{
              toggle = false;
            }
            d3.event.stopPropagation();
          });

      function dehighlight(){
        svg.selectAll('.area')
          .style('stroke-width', "1")
      .style('stroke-opacity', 1);
        $(targetSelector+"-selected-title").html('Color Name ');
        $('.tr-result').html('');
        $('.google').html('');
      }
      function highlight(d, i, clicked){
        svg.selectAll('.area1')
          .style('stroke-width', function(g,j){
            if (j==i) {
              $(targetSelector+"-selected-title").html(data_terms[j]);
            }
            return j==i ? 3 : 1;
          })
      .style('stroke-opacity', function(g,j){
            if (j==i) {
              $(targetSelector+"-selected-title").html(data_terms[j]);
            }
            return j==i ? 1 : .2;
          });


      }

    }

    function dataProcess(){
      for (let i = 0; i < Nbin; i++) {
        for (let j = 0; j < data_line.length; j++) {
          data_color_counts[i]+= data_line[j][i];
        }
        if(data_color_counts[i] === 0 ) {
          console.log("[ERR]Color space is not fully covered.");
        }
      }

      data_line = data_line.map(function(colorCount, index){
        let total = 0;
        for (let i = 0; i < colorCount.length; i++) {
          total += colorCount[i];
        }
        if(total === 0 ) {
          console.log("[ERR]Color space is not fully covered.");
        }
        return colorCount.map(function(count,i){
          return data_color_counts[i] === 0 ? 0 : count/data_color_counts[i];
        });
      });



    }

    function stackedArea(){
      //Sort the terms by mean(binNum)
      stacked_area = data_line.slice().sort((a, b) => meanIndex(a) - meanIndex(b));
      stacked_terms = data_terms.slice().sort((a, b) => meanIndex(data_line[data_terms.indexOf(a)]) - meanIndex(data_line[data_terms.indexOf(b)]));
      data_avgColor = data_avgColor.slice().sort((a, b) => meanIndex(data_line[data_avgColor.indexOf(a)]) - meanIndex(data_line[data_avgColor.indexOf(b)]));
      let acc = new Array(data_colors.length).fill(0);
      stacked_area = stacked_area.map(line => {
        let area = acc.slice().map((v, i) => {
          return {"y0": v, "y1": v + line[i]};
        });
        acc = acc.map((v, i) => v + line[i]);
        return area;
      });

    }
  }



});
function meanIndex(arr){
  let acc = arr.reduce((acc, cnt, i) => {
    acc.cnt += cnt;
    acc.sum += cnt * i;
    return acc;
  }, {sum: 0, cnt: 0});
  return acc.sum / acc.cnt;
}