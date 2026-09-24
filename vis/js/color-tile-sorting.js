const escapeHTML = str => String(str).replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
  }[tag]));


const sortingAvgRequest = await fetch("../model/sortingAverages.json")
const sortingAverages = await sortingAvgRequest.json()

$("#data_view").html("")

let i = 0
for(const sortAvgSet of sortingAverages){
    $("#data_view").append(`
        <hr>
        <div>
            <ul>
            <li>Test Version ${sortAvgSet.version} (${sortAvgSet.version == 1 ? "LAB" : "oklab"} color space)</li>
            ${sortAvgSet.colorBlindness ? `<li>Color Blindness: ${sortAvgSet.colorBlindness} </li>`: "" }
            ${sortAvgSet.backgroundColor ? `<li>Background Color: ${sortAvgSet.backgroundColor} </li>`: "" }
            ${sortAvgSet.displayColorSpace ? `<li>Display Color Space: ${sortAvgSet.displayColorSpace} </li>`: "" }
            <li>Average Score: ${sortAvgSet.avgScore}</li>
            <li>Num Users: ${sortAvgSet.numScores}</li>
            </ul>
            <div id="resultSet${i}"></div>
        </div>
        `)
    drawSpectrumGraph(`resultSet${i}`, sortAvgSet, 6, 15)
    i++
}

drawSpectrumGraph("data_table", sortingAverages[3], 6, 15)


function drawSpectrumGraph(domId, fulldata, N, setN){  
  console.log("drawSpectrumGraph")

  const data = fulldata.tileErrors.map((d, i) => {
        return {
            ...d, 
            error: d.avgErrorAmount,
            color: d3.rgb(d.color),
            index: i
        }
    })

  var margin = {"top": 20, "bottom": 50, "left": 0, "right": 40};
  var width = 800, height= 130;
 
  if(width > 800){
  	width = 800;
  }
  var svg = d3.select("#" + domId).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
    .rangeRound([0, width])
    .domain([0,N*setN-1]);
    

  var y = d3.scaleLinear()
    .rangeRound([0, height])
    .domain([0, 1]);


  var colors = svg.selectAll('.color')
                  .data(data)
                  .enter()
                .append('g')
                  .attr('class','color');

  var colorPatches = colors.append('rect')
                         .attr('x', function(d){ return x(d.index); })
                         .attr('y', 0 )
                         .attr('width', function(d){ return x(d.index+1)-x(d.index) + .5;})
                         .attr('height', height )
                         .attr('fill', function(d){ return d.color.rgb(); });
  

  var intervals = colors.append('line')
                        .filter(function(d){ return d.index%N===0 && d.index!==0;})
                        .attr('x1', function(d){ return x(d.index);})
                        .attr('x2', function(d){ return x(d.index);})
                        .attr('y1', function(d){ return 0;})
                        .attr('y2', function(d){ return height;})
                        .attr('fill','none')
                        .attr('stroke','black')
                        .attr('opacity',0.18)
                        .attr('stroke-width', 2);

  var line = d3.line()
      .x(function(d){ return (x(d.index+1)+x(d.index))/2; })
      .y(function(d){ return y(d.error / d.maxError) + 2; })
      .curve(d3.curveBasis);
      
  var line2 = d3.line()
      .x(function(d){ return (x(d.index+1)+x(d.index))/2; })
      .y(function(d){ return y(d.error / d.maxError)+ 3.5; })
      .curve(d3.curveBasis);

  svg.append('path')
        .attr("d", line(data))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "none");
        
  svg.append('path')
        .attr("d", line2(data))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("fill", "none");
        
  //
  var textXPos = 0;
  // text in RTL languages (like Farsi) needs to start on the right side of the graph
  if(window.direction == "rtl"){
    textXPos = width + margin.left + margin.right;
  }

  svg.append('text')
  		.attr("x", textXPos )
  		.attr("y", 15 - margin.top)
  		.text("Tile in correct position")
		.attr("fill", "black")
  		
   svg.append('text')
  		.attr("x", textXPos )
  		.attr("y", height + 15)
  		.text("Tile far from correct position")
		.attr("fill", "black")
  		
  
   svg.append('text')
          .attr("x", textXPos )
          .attr("y", height + 30)
          .attr("fill", "#999")
          .text("*The spectrum is divided into the six color sets users sorted.")

}

