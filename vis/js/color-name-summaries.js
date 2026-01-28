
const escapeHTML = str => String(str).replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
  }[tag]));



let grid = undefined

const hueColorNames = await d3.csv("../model/hue_colors_info.csv");
const fullColorNames = await d3.csv("../model/full_colors_info.csv");
const colorSampleSOMs = await (await fetch("../model/colorSOMPatches.json")).json();

console.log(hueColorNames[0]);

$("#selected_langs").change(e => { 
    updateTableData()
})

$("input:radio[name=rgb-set]").change(e => { 
    updateRgbSet()
})

let currentDataset
let currentDatasetRgbSet
let currentDatasetLangAbv
$("#download_language_subset_button").click(e => {
    const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentDataset)
    
    // based on:
    // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentDatasetRgbSet}_summaries_${currentDatasetLangAbv}.csv`);
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
                    allBothNamesByLang[lang].push({
                        simplifiedName: term,
                        commonName: hueTermRow ? hueTermRow.commonName : fullTermRow.commonName,
                        avgColorRGBCode: fullTermRow ? fullTermRow.avgColorRGBCode : undefined,
                        avgL: fullTermRow ? fullTermRow.avgL : undefined,
                        avgA: fullTermRow ? fullTermRow.avgA : undefined,
                        avgB: fullTermRow ? fullTermRow.avgB : undefined,
                        avgHueColor: hueTermRow ? hueTermRow.avgHueColor : undefined,
                        somColorPatch: somColorPatch,
                        totalColorFraction: fullTermRow ? fullTermRow.totalColorFraction : undefined,
                        numFullNames: fullTermRow ? fullTermRow.numFullNames : undefined,
                        numHueNames: fullTermRow ? fullTermRow.numLineNames : hueTermRow.cnt,
                    })
                }
            }
        }
        color_set = allBothNamesByLang
        $("#source-data-link").attr("href", "https://github.com/uwdata/color-naming-in-different-languages/blob/master/model/")
    } else if(rgbSet == "full-data"){
        if(!allFullNamesByLang){
            allFullNamesByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
            for(const lang of Object.keys(allFullNamesByLang)){
                for(const row of allFullNamesByLang[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName

                    row.numHueNames = row.numLineNames
                    row.somColorPatch = langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined
                }
            }
        }
        color_set = allFullNamesByLang
        $("#source-data-link").attr("href", "https://github.com/uwdata/color-naming-in-different-languages/blob/master/model/full_colors_info.csv")
    } else { // hue
        if(!allHueNamesByLang){
            allHueNamesByLang = Object.groupBy(hueColorNames, ({lang}) => lang)
            for(const lang of Object.keys(allHueNamesByLang)){
                for(const row of allHueNamesByLang[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName
                    row.numHueNames = row.cnt
                }
            }
        }
        color_set = allHueNamesByLang
        $("#source-data-link").attr("href", "https://github.com/uwdata/color-naming-in-different-languages/blob/master/model/hue_colors_info.csv")
    }

    $("#selected_langs").empty()
    let selected_lang_temp = true
    for(const lang of Object.keys(color_set).sort()){
        $("#selected_langs").append(new Option(lang, lang, true, selected_lang_temp))
        selected_lang_temp = false
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

    if(!grid){
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

        grid = new gridjs.Grid({
            columns: [{
                    "id": "commonName", 
                    name: gridjs.html('Name<br><span class="simplified-name">simplified name</span>'),
                    data: (row) => row,
                    sort: {
                        compare: (a, b) =>  a.commonName.localeCompare(b.commonName)
                    },
                    formatter: (cell, row, col) => gridjs.html(`${escapeHTML(cell.commonName)}<br><span class="simplified-name">${escapeHTML(cell.simplifiedName)}</span>`)
                },{
                    id: "avgColor",
                    name: gridjs.html('Avg Color<br><span class="simplified-name">full / hue</span>'),
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
                        //const avgColor = "avgColorRGBCode" in cell ? cell.avgColorRGBCode : cell.avgHueColor
                        return gridjs.html(`
                        <div
                            style="height:30px; width: 30px; border-radius: 15px; float:left; margin: 5px;
                            background-color:${cell.avgColorRGBCode ? cell.avgColorRGBCode : "rgba(0,0,0,0)"};" title="${escapeHTML(cell.avgColorRGBCode ? cell.avgColorRGBCode : "")}" >
                        </div>
                        <div
                            style="height:30px; width: 30px; border-radius: 15px; float:left; margin: 5px;
                            background-color:${cell.avgHueColor ? cell.avgHueColor : "rgba(0,0,0,0)"};" title="${escapeHTML(cell.avgHueColor ? cell.avgHueColor : "")}" >
                        </div>
                        `)
                    }
                },
                {
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
                    
                },
                "Full Bins",
                "Hue Bins",
                {
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
                }
                
                ],
            sort: true,
            search:  {
                selector: (cell, rowIndex, cellIndex) => cellIndex === 0 ? cell.commonName : cell
            },
            pagination: true,
            data: nameData.sort(namePercentSort)
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

    } else {
        grid.updateConfig({
            data: nameData
        }).forceRender();
    }
    
}


function generateColorGrid(nodes){
    const totalGridPx = 40
	let str = "";
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

	return str;
}






