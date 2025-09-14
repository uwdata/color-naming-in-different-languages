$(document).on('ready page:load', function () {
  let minSal = 0;
  let Nbin, emptyNbin;
  let rootPath = window.location.pathname.split('/').slice(0,-1).join("/");
  let langNum;
  $.getJSON("../model/hue_color_names_aggregated.json", function( data ) {
    Nbin = data.colorSet.length;
    emptyNbin = [];
    for (let i = 0; i < Nbin; i++) {
      emptyNbin.push(0);
    }

    debugger;
    let langs = Object.keys(data).filter(key => key !== "colorSet").sort();
    langNum = langs.length;
    langs.forEach((lang, i) => {
      $(".container").append('<div class="row" id="vis'+i+'"></div>');
      drawLangSpec('#vis'+i, data, lang, data.colorSet, i);
    });
  });



  function drawLangSpec(targetSelector, data, lang, colorSet, index){

    let data_terms = data[lang].terms;
    let data_colors = colorSet;
    let data_color_counts = emptyNbin.slice();
    let data_line = data[lang].colorNameCount;
    let data_avgColor = data[lang].avgColor.slice();
    let stacked_area = [];
    let stacked_terms = [];

    let saliencies = emptyNbin.slice();
    dataProcess();
    stackedArea();
    extendTail();

    minSal = Math.min(...saliencies, minSal);
    data_line = stacked_area;
    data_terms = stacked_terms;


    drawing();


    function extendTail(){
      let repeatition = 0.2;
      data_line = data_line.map(function(colorCount){
        return colorCount.concat(colorCount.slice().splice(0,Math.round(colorCount.length * repeatition)));
      });

      stacked_area = stacked_area.map(function(colorCount){
        return colorCount.concat(colorCount.slice().splice(0,Math.round(colorCount.length * repeatition)));
      });

      saliencies = saliencies.concat(saliencies.slice().splice(0,Math.round(saliencies.length * repeatition)));
      data_colors = data_colors.concat(data_colors.slice().splice(0,Math.round(data_colors.length * repeatition)));
    }

    function drawing(){
      let spectrumN = stacked_area[0].length;

      let marginTop = index === 0 ? 30 : 4;
      let marginBottom = index === langNum ? 30 : 9;
      let margin = {top: marginTop, right: 30, bottom: marginBottom, left: 100},
          width = 500 - margin.left - margin.right,
          height = 27;

      let x = d3.scaleLinear()
          .range([0, width]);


      let y = d3.scaleLinear()
          .range([height, 0]);

      let rPow = d3.scalePow()
          .exponent(2)
          .range([0, 3])
          // .domain(d3.extent(saliencies)); // Local scale
          .domain([0, 3]); // (minSal : -2.847881943650801) Global Scale

      let r = d => {
        return rPow(d + 3);
      };

      x.domain([0,spectrumN-1]);
      y.domain([0,1]);


      let yAxis = d3.axisRight()
          .scale(y).ticks(3);

      let toggle = false;

      let area = d3.area()
          .x((d, i) => x(i))
          .y0((d, i) => y(d.y0))
          .y1((d, i) => y(d.y1));
          // .curve(d3.curveBasis);

      let svg = d3.select(targetSelector).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      svg.append("g")
          .attr("class", "y axis")
          .attr('transform',`translate(${width -1}, -0.5)`)
          .call(yAxis);

      let title = svg.append('text')
            .attr('class','vis-title')
            .attr('x',-5)
            .attr('y',height/2 - 5)
            .text(lang.split(" ")[0].replace("(Farsi)",""))
            .style("font-size", "10px")
            .style("text-anchor", "end")
            .style("alignment-baseline", "middle")
            .style("font-weight", "bold");

      let info = svg.append('text')
            .attr('x',-5)
            .attr('y',height/2 + 6)
            .text(" (" + data[lang].totalCount +")")
            .style("font-size", "10px")
            .style("text-anchor", "end")
            .style("alignment-baseline", "middle");

      if (index === 0) {
        let colorPatch = svg.selectAll(".color_patch")
          .data(data_colors)
          .enter().append("rect")
            .attr("class", "color_patch")
            .attr("x", function(d,i) { return i === 0 ? 0 : x(i) - ((x(1)-x(0)) /2); })
            .attr("y", -15)
            .attr("width", function(d,i) { return [0, spectrumN-1].indexOf(i) >= 0 ? (x(1)-x(0)) /2 : x(1)-x(0)+1; } )
            .attr("height", 10 )
            .attr("fill", function(d){ return 'rgb(' + d.rgb.r + ',' + d.rgb.g+',' + d.rgb.b + ')' ;})

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + width/2 +", -20)")
           .append("text")
            .text("Color Bins")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold");

        svg.append("text")
          .attr("x", -5)
          .attr("y", height+5.5)
          .text("Saliency → ")
          .style("alignment-baseline", "middle")
          .style("font-size", "8px")
          .style("text-anchor", "end");

      }


      let saliencyTiles = svg.selectAll(".saliencyTile")
        .data(saliencies)
       .enter().append("circle")
        .attr("class", "saliencyTile")
        .attr("cx", function(d,i) { return x(i); })
        .attr("cy", height + 5)
        .attr("r", r)
        .attr("fill", "#555");




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
          .style("stroke", '#333')
          .style("opacity", 1)
          .style('stroke-width', "0.5");


      term.append("path")
          .attr("class", "fake-area")
          .attr("d", area)
          .style("fill", '#fff')
          .attr('opacity', 0);



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

      saliencies = saliencies.map((d, i) => {
        return -entropy(data_line.map(d => d[i]));
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

function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}

function meanIndex(arr){
  let acc = arr.reduce((acc, cnt, i) => {
    acc.cnt += cnt;
    acc.sum += cnt * i;
    return acc;
  }, {sum: 0, cnt: 0});
  return acc.sum / acc.cnt;
}