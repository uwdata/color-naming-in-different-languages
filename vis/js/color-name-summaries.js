import BinSize from "../../shared_files/binSize.js";
import FullColorBinView from "./full-color-bin-view.js";

const fullBinSize = new BinSize({
    type: "ring",
    l: 1/5, c: 1/20, h_divs: 8,
    simpleName: "LCH Arcs: Low-res",
    displayLABArcs: true
  })

// const fullBinSize = new BinSize({
//     type: "box",
//     l: 1/5, ab: 1/20,
//     simpleName: "LAB Boxes: Low-res",
//   })


const escapeHTML = str => String(str).replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
  }[tag]));

const cellHeight = 60


let grid = undefined

let hueColorNames,
    fullColorNames,
    colorSampleSOMs,
    fullBinsInfo,
    colorSampleFullBinsGrouped

await Promise.all([
    new Promise(async (r) => {
        hueColorNames = await d3.csv("../model/hue_colors_info.csv"); 
        r()}),
    new Promise(async (r) => {
        fullColorNames = await d3.csv("../model/full_colors_info.csv")
        r()}),
    new Promise(async (r) => {
        colorSampleSOMs = await (await fetch("../model/colorSOMPatches.json")).json()
        r()}),
    new Promise(async (r) => {
        const fullBinsInfoAll = await (await fetch(`../model/color_info_pre_naming/oklab_bins_${fullBinSize}.json`)).json()
        fullBinsInfo = fullBinSize.filterBinsByGamut(fullBinsInfoAll, "rgb")  //assume just rgb bins
        r()}),
    new Promise(async (r) => {
        const colorSampleFullBinsZipped = await (await fetch(`../model/binned_full_colors/full_color_names_binned_blur_${fullBinSize}.json.gz`)).arrayBuffer()
        const colorSampleFullBinsFlat = JSON.parse(pako.ungzip(colorSampleFullBinsZipped,{ to: 'string' }))
        colorSampleFullBinsGrouped = d3.groups(colorSampleFullBinsFlat, d => d.lang, d => d.term)
          .map(a => {return {key: a[0], values: a[1].map(b => {return{key: b[0], values: b[1]}}) }})
        r()})
])

const colorSampleFullBins = {}
for(const [i, langVal] of colorSampleFullBinsGrouped.entries()){
    const lang = langVal.key
    const langData = langVal.values
    colorSampleFullBins[lang] = {}
    for(const [j, termVal] of langData.entries()){
        const term = termVal.key
        const termData = termVal.values
        colorSampleFullBins[lang][term] = termData
    }
}


const hueBins36 = await d3.csv("../model/color_info_pre_naming/hue_color_bins_36_rgb.csv");
const hueBins72 = await d3.csv("../model/color_info_pre_naming/hue_color_bins_72_rgb.csv");
const colorSampleHueBins36Blur = await (await fetch("../model/binned_hue_colors/hue_color_names_binned_36_blur.json")).json();
const colorSampleHueBins72Blur = await (await fetch("../model/binned_hue_colors/hue_color_names_binned_72_blur.json")).json();


console.log(hueColorNames[0]);

$("#selected_langs").change(e => { 
    updateTableData()
})

$("input:radio[name=rgb-set]").change(e => { 
    updateRgbSet()
})

$("#hue_bins_in_circle").change(() => {
    updateTableData()
    //redrawTable() // For some reason, this doesn't fix spacing issues
})

let currentDataset
let currentDatasetRgbSet
let currentDatasetLangAbv
$("#download_language_subset_button").click(e => {
    //const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentDataset)
    const jsonContent = "data:text/csv;charset=utf-8," + JSON.stringify(currentDataset, null, 2)
    
    // based on:
    // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    
    //var encodedUri = encodeURI(csvContent);
    var encodedUri = encodeURI(jsonContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    //link.setAttribute("download", `${currentDatasetRgbSet}_summaries_${currentDatasetLangAbv}.csv`);
    link.setAttribute("download", `${currentDatasetRgbSet}_summaries_${currentDatasetLangAbv}.json`);
    document.body.appendChild(link); // Required for FF

    link.click();
})

let allHueNamesByLang
let allFullNamesByLang
let allBothNamesByLang


updateRgbSet()

function updateRgbSet(){
    const rgbSet = $("input[name='rgb-set']:checked").val()

    if(currentDatasetRgbSet == rgbSet){
        return
    }

    currentDatasetRgbSet = rgbSet

    let color_set
    if(rgbSet == "both-hue-full"){
        if(!allBothNamesByLang){
            const fullNameSetByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
            const hueNameSetByLang = Object.groupBy(hueColorNames, ({lang}) => lang)
            const allLangs = new Set([...Object.keys(fullNameSetByLang), ...Object.keys(hueNameSetByLang)])
            allBothNamesByLang = {}
            for(const lang of allLangs){
                allBothNamesByLang[lang] = []
                let allTerms = new Set()
                if(lang in fullNameSetByLang){
                    allTerms = new Set([...allTerms, ...fullNameSetByLang[lang].map(d=> d.simplifiedName)])
                }
                if(lang in hueNameSetByLang){
                    allTerms = new Set([...allTerms, ...hueNameSetByLang[lang].map(d=> d.simplifiedName)])
                }
                for(const term of allTerms){
                    const hueTermRow =  lang in hueNameSetByLang ? hueNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
                    const fullTermRow =  lang in fullNameSetByLang ? fullNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
                    const langAbv = fullTermRow ? fullTermRow.lang_abv : hueTermRow.lang_abv
                    const somColorPatch = langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined
                    
                    const hueBinsData = langAbv in colorSampleHueBins72Blur && term in colorSampleHueBins72Blur[langAbv] ?
                        colorSampleHueBins72Blur[langAbv][term] : 
                            langAbv in colorSampleHueBins36Blur && term in colorSampleHueBins36Blur[langAbv] ?
                            colorSampleHueBins36Blur[langAbv][term] : undefined

                    const fullBinsData = lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
                        colorSampleFullBins[lang][term] : undefined

                    allBothNamesByLang[lang].push({
                        simplifiedName: term,
                        commonName: hueTermRow ? hueTermRow.commonName : fullTermRow.commonName,
                        lang_abv: hueTermRow ? hueTermRow.lang_abv : fullTermRow.lang_abv,
                        avgColorRGBCode: fullTermRow ? fullTermRow.avgColorRGBCode : undefined,
                        avgL: fullTermRow ? fullTermRow.avgL : undefined,
                        avgA: fullTermRow ? fullTermRow.avgA : undefined,
                        avgB: fullTermRow ? fullTermRow.avgB : undefined,
                        avgHueColor: hueTermRow ? hueTermRow.avgHueColor : undefined,
                        somColorPatch: somColorPatch,
                        totalColorFraction: fullTermRow ? fullTermRow.totalColorFraction : undefined,
                        numFullNames: fullTermRow ? fullTermRow.numFullNames : undefined,
                        numHueNames: fullTermRow ? fullTermRow.numLineNames : hueTermRow.cnt,
                        hueBinsData: hueBinsData,
                        fullBinsData: fullBinsData
                    })
                }
            }
        }
        color_set = allBothNamesByLang
    } else if(rgbSet == "full-data"){
        if(!allFullNamesByLang){
            allFullNamesByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
            for(const lang of Object.keys(allFullNamesByLang)){
                for(const row of allFullNamesByLang[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName

                    row.numHueNames = row.numLineNames
                    row.somColorPatch = langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined

                    row.fullBinsData = lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
                        colorSampleFullBins[lang][term] : undefined
                }
            }
        }
        color_set = allFullNamesByLang
    } else { // hue
        if(!allHueNamesByLang){
            allHueNamesByLang = Object.groupBy(hueColorNames, ({lang}) => lang)
            for(const lang of Object.keys(allHueNamesByLang)){
                for(const row of allHueNamesByLang[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName

                    row.numHueNames = row.cnt
                    row.hueBinsData = langAbv in colorSampleHueBins72Blur && term in colorSampleHueBins72Blur[langAbv] ?
                        colorSampleHueBins72Blur[langAbv][term] : 
                            langAbv in colorSampleHueBins36Blur && term in colorSampleHueBins36Blur[langAbv] ?
                            colorSampleHueBins36Blur[langAbv][term] : undefined
                }
            }
        }
        color_set = allHueNamesByLang
    }

    let prev_selected_lang = $("#selected_langs").val()
    if(!prev_selected_lang){
        prev_selected_lang = "Korean (한국어, 조선어)"
    }
    if(!Object.keys(color_set).includes(prev_selected_lang)){
        prev_selected_lang = Object.keys(color_set).sort()[0]
    }
    $("#selected_langs").empty()
    for(const lang of Object.keys(color_set).sort()){
        $("#selected_langs").append(new Option(lang, lang, true, lang == prev_selected_lang))
    }

    updateTableData();
}


function updateTableData(){

    const selected_lang = $("#selected_langs").val()
    if(!selected_lang){
        return
    }

    const rgbSet = $("input[name='rgb-set']:checked").val()

    let allNamesByLang
    if(rgbSet == "both-hue-full"){
        allNamesByLang = allBothNamesByLang
    } else if(rgbSet == "full-data"){
        allNamesByLang = allFullNamesByLang
    } else { // hue
        allNamesByLang = allHueNamesByLang
    }


    currentDatasetLangAbv = allNamesByLang[selected_lang][0].lang_abv

    let nameData = allNamesByLang[selected_lang]

    currentDataset = nameData

    if(grid){
        grid.destroy() 
    }
    $("#loading-data-span").hide()

    function namePercentSort(a, b){
        if(a.totalColorFraction){
            if(b.totalColorFraction){
                const diff = b.totalColorFraction - a.totalColorFraction
                // for some reason sort fails if these are small values, so make them bigger
                const returnVal = diff < 0 ? -1 : diff > 0 ? 1 : 0
                return returnVal
            } else {
                return -1
            }
        } else {
            if(b.totalColorFraction){
                return 1
            } else {
                return parseFloat(b.numHueNames) - parseFloat(a.numHueNames)
            }
        }
    }

    // Grid column definitions
    const gridColumns = []

    gridColumns.push({
        "id": "commonName", 
        name: gridjs.html(`
            <p style="margin-bottom:0px">Name</p>
            <p style="margin-bottom:0px" class="simplified-name">simplified name</p>`),
        data: (row) => row,
        sort: {
            compare: (a, b) =>  a.commonName.localeCompare(b.commonName)
        },
        formatter: (cell, row, col) => gridjs.html(`<p style="margin-bottom:0px">${escapeHTML(cell.commonName)}
            <p style="margin-bottom:0px" class="simplified-name">${escapeHTML(cell.simplifiedName)}</p>`)
    })

    gridColumns.push({
        id: "avgColor",
        name: gridjs.html(`
            <p style="margin-bottom:0px">Avg Color</p>
            <p class="simplified-name" style="margin-bottom:0px">${rgbSet == "both-hue-full" ? "full / hue" : rgbSet == "full-data" ? "full" : "hue"}</p>`),
        data: (row) => row,
        sort: {
            compare: (a, b) => {
                let a_h, b_h
                if("avgL" in a){
                    a_h = new Color({space: "oklab", coords: [a.avgL, a.avgA, a.avgB]}).to("oklch").h
                    b_h = new Color({space: "oklab", coords: [b.avgL, b.avgA, b.avgB]}).to("oklch").h
                } else {
                    a_h = new Color(a.avgHueColor).to("oklch").h
                    b_h = new Color(b.avgHueColor).to("oklch").h
                }
                return a_h - b_h
            }
        },
        formatter: (cell, row, col) => {
            return gridjs.html(`
                <div style="white-space:nowrap">
                    ${rgbSet == "both-hue-full" || rgbSet == "full-data" ? `
                        <div
                            style="height:${cellHeight/2}px; width: ${cellHeight/2}px; border-radius: ${cellHeight/4}px; display: inline-block; margin: 5px;
                            background-color:${cell.avgColorRGBCode ? cell.avgColorRGBCode : "rgba(0,0,0,0)"};" title="${escapeHTML(cell.avgColorRGBCode ? cell.avgColorRGBCode : "")}" >
                        </div>` : ""
                    }
                    ${rgbSet == "both-hue-full" ? `<div style="height:${cellHeight/2}px; width:0px; display: inline-block; margin:5px; border:solid rgba(128,128,128,0.5) 1px"></div>` : ""}
                    ${rgbSet == "both-hue-full" || rgbSet == "hue-data" ? `
                        <div
                            style="height:${cellHeight/2}px; width: ${cellHeight/2}px; border-radius: ${cellHeight/4}px; display: inline-block; margin: 5px;
                            background-color:${cell.avgHueColor ? cell.avgHueColor : "rgba(0,0,0,0)"};" title="${escapeHTML(cell.avgHueColor ? cell.avgHueColor : "")}" >
                        </div>` : ""
                    }
                </div>`)
        }
    })

    if(rgbSet == "both-hue-full" || rgbSet == "full-data"){
        gridColumns.push({
            id: "somColorPatch",
            name: "Sample",
            sort: false,
            formatter: (cell, row, col) => {
                if(!cell){
                    return ""
                }
                return gridjs.html(
                    'colorNodes16' in cell ? generateColorGrid(cell.colorNodes16) :
                    'colorNodes9' in cell ?  generateColorGrid(cell.colorNodes9) :
                    generateColorGrid(cell.colorNodes4)
                )
            }
        })

        gridColumns.push({
            id: "fullBinsData",
            name: "Full Bins",
            width: "262px",
            sort: false,
            formatter: (cell, row, col) => {
                return cell ? gridjs.html(generateFullColorBinSvg(cell).node().outerHTML) : ""
                
            }
        })
    }

    if(rgbSet == "both-hue-full" || rgbSet == "hue-data"){
        gridColumns.push({
            id: "hueBinsData",
            name: "Hue Bins",
            sort: false,
            formatter: (cell, row, col) => {
                if($("#hue_bins_in_circle").is(':checked')){
                    return cell ? gridjs.html(generateHueColorRingSvg(cell).node().outerHTML) : ""
                } else {
                    return cell ? gridjs.html(generateHueColorSvg(cell).node().outerHTML) : ""
                }
            }
        })
    }

    gridColumns.push({
        id: "NamePercent",
        name: "% of names",
        data: (row) => row,
        sort:  {
            compare: namePercentSort
        },
        formatter: (cell, row, col) => {
            if(cell.totalColorFraction){
                return (cell.totalColorFraction * 100).toPrecision(3) / 1 + "%"
            } else {
                return cell.numHueNames + " hue names"
            }
        }
    })

    grid = new gridjs.Grid({
        columns: gridColumns,
        sort: true,
        search:  {
            selector: (cell, rowIndex, cellIndex) => cellIndex === 0 ? cell.commonName : cell
        },
        pagination: true,
        data: nameData.sort(namePercentSort),
        // style: {
        //     td: {
        //         padding: "6px 12px"
        //     }
        // }
    }).render(document.getElementById("data_table"));

    // try to set default sort
    function trySetDefaultSort(){
        setTimeout(() => {
            const column = document.querySelector('[data-column-id="NamePercent"]')
            if(column){
                column.click()
            } else {
                trySetDefaultSort()
            }
        }, 100)
    }
    trySetDefaultSort()

    // } else {
    //     grid.updateConfig({
    //         data: nameData
    //     }).forceRender();
    // }
    
}

function redrawTable(){
    // TODO: for some reason this doesn't recalculate column widths
    grid.forceRender()
}


function generateColorGrid(nodes){
    const totalGridPx = cellHeight
	let str = `<div style="width:${cellHeight}px; height:${cellHeight}px; margin: auto;">`;
	for(let i = 0; i < nodes.length; i++){
		for(let j = 0; j < nodes.length; j++){
			let node = nodes[i][j];
			str += "<div style='";
			str += "width: "+totalGridPx/nodes.length+"px; height: "+totalGridPx/nodes.length+"px;float:left;"
			str += "background-color:"+node.rgb;
			str += "'><small>";
			//str += Math.round(node.PCgN*100) + "%"
			//str += Math.round(node.PCgN*100) + "%"
			str += "</small></div>";
		}
		str += "<div style='clear:both'></div>";
	}

	return str + "</div>";
}


function generateHueColorSvg(hueData){
    combineHueBinDataWithColors(hueData)

    const width = 200,
        height = cellHeight

    const hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
    
    let spectrumN = hueData.bins.length;

    let x = d3.scaleLinear()
        .range([0, width])
        .clamp(true);

    let y = d3.scaleLinear()
        .range([0, height]);


    x.domain([0,spectrumN]);

    const maxPCT = Math.max(...hueData.bins.map(b => b.pCT))
    y.domain([0,maxPCT]);
    //y.domain([0,1]);

    let yAxis = d3.axisLeft()
        .scale(y);

    let colorPatch = hueBinSvg.selectAll(".color_patch")
        .data(hueData.bins.filter(d => d.pCT > 0))
        .join("rect")
        .attr("class", "color_patch")
        .attr("x", (d) => (x(d.colorBin.bin_i)+x(d.colorBin.bin_i-1))/2)
        .attr("y",  d => height - y(d.pCT))//d => y(d.pCT))
        .attr("width", (d) => d.colorBin.bin_i===(spectrumN-1) ? (x(1)-x(0)) /2 : x(1)-x(0)+1 )
        .attr("height", d => y(d.pCT))
        .attr("fill", d => d.binColorStr)


    //   let axisTitle = 'Probability of Name, given Color';
    //   svg.append("g")
    //       .attr("class", "y axis")
    //       .call(yAxis);

    //   svg.append('text')
    //       .text(axisTitle)
    //       .attr('y',-30)
    //       .attr('x', -height/2)
    //       .attr('transform','rotate(-90)')
    //       .attr('text-anchor','middle');
    return hueBinSvg
}

function generateHueColorRingSvg(hueData){
    combineHueBinDataWithColors(hueData)

    const width = cellHeight,
        height = cellHeight

    const hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
    
    let spectrumN = hueData.bins.length;


    const centerRadius = 15
    const bandWidth = 15

    let binWidthScale = d3.scaleLinear()
        .range([0, bandWidth]);
    const maxPCT = Math.max(...hueData.bins.map(b => b.pCT))
    binWidthScale.domain([0,maxPCT]);

    hueBinSvg.append("circle")
        .attr("cx", width/2)
        .attr("cy", height/2)
        .attr("r", centerRadius)
        .attr("fill", "rgba(128,128,128,0.1)")

    
    // TODO: add hue bin range in middle

    hueBinSvg.selectAll(".color_patch")
        .data(hueData.bins.filter(d => d.pCT > 0))
        // .data(hueData.bins)
        .join("path")
        .attr("class", "color_patch")
        .attr("d", d => {
            const startBinI = (d.colorBin.bin_i-1) % spectrumN
            const endBinI = d.colorBin.bin_i 

            const binWidth = binWidthScale(d.pCT)
            // const binWidth = binWidthScale(maxPCT)

            const correctedRadius = centerRadius + binWidth / 2
            
            const x_start = correctedRadius * - Math.sin(
                startBinI
                / spectrumN * 2 * Math.PI)
            const y_start = correctedRadius * - Math.cos(
                startBinI
                / spectrumN * 2 * Math.PI)
            const x_end = correctedRadius * - Math.sin(
                endBinI
                / spectrumN * 2 * Math.PI)
            const y_end = correctedRadius * - Math.cos(
                endBinI
                / spectrumN * 2 * Math.PI)
            //a_bin_dims.b_bin = a.c_center * Math.sin(a.h_center / 360 * 2 * Math.PI)
            return `
            M ${width/2 + x_start} ${height/2 + - y_start} 
            A ${correctedRadius} ${correctedRadius} 0 0 ${1/*arcDirection*/} ${width/2 + x_end} ${height/2 + - y_end}
            `
        })
        .style("stroke-width", (d) => binWidthScale(d.pCT))
        //.style("stroke-width", (d) => binWidthScale(maxPCT))
        .attr("stroke", d => d.binColorStr)

    
    return hueBinSvg
}


function combineHueBinDataWithColors (hueData){
    if("colorBin" in hueData.bins[0]){ // if we've already done this, no need to repeat
        return
    }

    // TODO: check bin size
    for(const[binN, binDataInfo] of hueData.bins.entries()){
        binDataInfo.colorBin = hueData.bins.length == 72 ?
            hueBins72.find(b => parseInt(b.bin_i) == binN) : 
            hueBins36.find(b => parseInt(b.bin_i) == binN) //assume alternative is 36
        binDataInfo.binColorStr = `rgb(${binDataInfo.colorBin.bin_center_r},${binDataInfo.colorBin.bin_center_g},${binDataInfo.colorBin.bin_center_b})`
    }
}

function generateFullColorBinSvg(fullData){
    const maxWidth = 300,
        maxHeight = cellHeight

    const binView = new FullColorBinView({
      bin_size: fullBinSize,
      bin_array: fullBinsInfo,
      x_dim: "-b",
      y_dim: "-a",
      split_dim: "l",
    })


    // TODO: Why does p(C|T) look so much worse than p(T|C)????
    //  Is there an error in the calculation?????
    //  Do I have some confusion on teh definition????
    //   Maybe we ignored or misused binning in the definition???

    //const maxPCT = Math.max(...fullData.map(d => d.pCT))
    const maxPTC = Math.max(...fullData.map(d => d.pTC))

    binView.setDisplayOffsets(binView.getDisplayOffsets())


    const ratioHeight = maxWidth * binView.display_offsets.y_height_in_bins /  binView.display_offsets.x_width_in_bins
    
    const height = Math.min(maxHeight, ratioHeight)

    const width = height * binView.display_offsets.x_width_in_bins / binView.display_offsets.y_height_in_bins



    const hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)


    binView.createOrUpdateColorTiles(hueBinSvg, {
        TILE_SEGMENT_OUTER_MARGIN_NUM: 0,
        getTileScale: (b) => {
            const binData = fullData.find((d) => 
                fullBinSize.type == "ring" ? 
                    b.l_bin == d.binL && b.c_bin == d.binC && b.h_bin == d.binH :
                    b.l_bin == d.binL && b.a_bin == d.binA && b.b_bin == d.binB
            )

            //return 1 // for testing showing all colors

            return binData ? 1.5 * Math.sqrt(binData.pTC / maxPTC) : 0

            
        },
    })

    return hueBinSvg
}




