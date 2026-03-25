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

let basicColorInfo,
    hueColorNames,
    fullColorNames,
    colorSampleSOMs,
    fullBinsInfo,
    colorSampleFullBinsGrouped

await Promise.all([
    new Promise(async (r) => {
        basicColorInfo = await d3.csv("../model/basic_colors_info.csv"); 
        r()}),
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
        //const colorSampleFullBinsFlat = await (await fetch(`../model/binned_full_colors/full_color_names_binned_${fullBinSize}.json`)).json()
        
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


function getColorInfo(langAbv, term){
    const lang = langAbvToLang[langAbv]

    const basicNameInfoByLang = Object.groupBy(basicColorInfo, ({lang}) => lang)
    const fullNameSetByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
    const hueNameSetByLang = Object.groupBy(hueColorNames, ({lang}) => lang)

    const basicInfoTermRow =  lang in basicNameInfoByLang ? basicNameInfoByLang[lang].find(d => d.simplifiedName == term) : undefined
    const hueTermRow =  lang in hueNameSetByLang ? hueNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
    const fullTermRow =  lang in fullNameSetByLang ? fullNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
    const somColorPatch = langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined

    const hueBinsData = langAbv in colorSampleHueBins72Blur && term in colorSampleHueBins72Blur[langAbv] ?
        colorSampleHueBins72Blur[langAbv][term] : 
            langAbv in colorSampleHueBins36Blur && term in colorSampleHueBins36Blur[langAbv] ?
            colorSampleHueBins36Blur[langAbv][term] : undefined

    if(hueBinsData){
        hueBinsData.langAbv = langAbv
    }

    const fullBinsData = lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
        colorSampleFullBins[lang][term] : undefined

    return {
        langAbv: langAbv,
        lang: lang,
        term: term,
        commonName: basicInfoTermRow ? basicInfoTermRow.commonName : hueTermRow ? hueTermRow.commonName : fullTermRow ? fullTermRow.commonName : undefined, 
        basicInfoTermRow: basicInfoTermRow,
        hueTermRow: hueTermRow,
        fullTermRow: fullTermRow,
        somColorPatch: somColorPatch,
        hueBinsData: hueBinsData,
        fullBinsData: fullBinsData
    }
}

console.log(hueColorNames[0]);

const langAbvToLang = {}

function nameToUnicode(name){
    return [...name].map(c => c.charCodeAt(0)).join("_")
}

function nameFromUnicode(unicodeString){
    return String.fromCharCode(...unicodeString.split("_"))
}


const colorDetailsModalEl = document.getElementById('color_details_modal')
const colorDetailsModal = new bootstrap.Modal(colorDetailsModalEl)

let currentColorTermData

colorDetailsModalEl.addEventListener('show.bs.modal', event => {
    const langAbv = event.relatedTarget.getAttribute("data-lang") 
    const term = nameFromUnicode(event.relatedTarget.getAttribute("data-color-name"))

    currentColorTermData =  getColorInfo(langAbv, term)

    $("#color_details_modal_name").text(currentColorTermData.basicInfoTermRow.commonName)
    $("#color_details_modal_lang").text(langAbv + " - " + currentColorTermData.lang)
    $("#color_details_modal_simplified_name").text(term)
    if(currentColorTermData.fullTermRow){
        $("#color_details_modal_full_details").show()
        $("#color_details_modal_full_perc").text(currentColorTermData.fullTermRow.tinyResBlurTermFraction * 100)
        $("#color_details_modal_full_rank").text("TBD")
        $("#color_details_modal_full_num_entries").text(currentColorTermData.basicInfoTermRow.numFullNames)
    } else {
        $("#color_details_modal_full_details").hide()
    }
    if(currentColorTermData.hueTermRow){
        $("#color_details_modal_hue_details").show()
        $("#color_details_modal_hue_perc").text("TBD")
        $("#color_details_modal_hue_rank").text("TBD")
        $("#color_details_modal_hue_num_entries").text(currentColorTermData.basicInfoTermRow.numLineNames)
    } else {
        $("#color_details_modal_hue_details").hide()
    }

    // Average Color Info
    if(currentColorTermData.fullTermRow){
        $("#color_details_modal_avg_full_color").show()
        $("#color_details_modal_avg_full_color_patch").css("background-color", currentColorTermData.basicInfoTermRow.avgFullColorRGBCode)
        $("#color_details_modal_avg_full_color_rgb").text(currentColorTermData.basicInfoTermRow.avgFullColorRGBCode)
        $("#color_details_modal_avg_full_color_oklab").text(new Color({space: "oklab", coords: [currentColorTermData.fullTermRow.tinyResBlurAvgL, currentColorTermData.fullTermRow.tinyResBlurAvgA, currentColorTermData.fullTermRow.tinyResBlurAvgB]}))
        $("#color_details_modal_avg_full_color_oklch").text(new Color({space: "oklab", coords: [currentColorTermData.fullTermRow.tinyResBlurAvgL, currentColorTermData.fullTermRow.tinyResBlurAvgA, currentColorTermData.fullTermRow.tinyResBlurAvgB]}).to("oklch"))
    } else{
        $("#color_details_modal_avg_full_color").hide()
    }

    if(currentColorTermData.hueTermRow){
        $("#color_details_modal_avg_hue_color").show()
        $("#color_details_modal_avg_hue_color_patch").css("background-color", currentColorTermData.basicInfoTermRow.avgHueRGBCode)
        $("#color_details_modal_avg_hue_color_rgb").text(currentColorTermData.basicInfoTermRow.avgHueRGBCode)
        $("#color_details_modal_avg_hue_color_oklab").text(new Color(currentColorTermData.basicInfoTermRow.avgHueRGBCode).to("oklab"))
        $("#color_details_modal_avg_hue_color_oklch").text(new Color(currentColorTermData.basicInfoTermRow.avgHueRGBCode).to("oklch"))
    } else {
        $("#color_details_modal_avg_hue_color").hide()
    }

    // SOM Sample patches
    if(currentColorTermData.somColorPatch){
        $("#color_details_modal_color_sample_patch_2").show()
        $("#color_details_modal_color_sample_patch_2_display").html(generateColorGrid(currentColorTermData.somColorPatch.colorNodes4))

        if('colorNodes9' in currentColorTermData.somColorPatch){
            $("#color_details_modal_color_sample_patch_3").show()
            $("#color_details_modal_color_sample_patch_3_display").html(generateColorGrid(currentColorTermData.somColorPatch.colorNodes9))
        }else {
            $("#color_details_modal_color_sample_patch_3").hide()
        }
        
        if('colorNodes16' in currentColorTermData.somColorPatch){
            $("#color_details_modal_color_sample_patch_4").show()
            $("#color_details_modal_color_sample_patch_4_display").html(generateColorGrid(currentColorTermData.somColorPatch.colorNodes16))
        }else {
            $("#color_details_modal_color_sample_patch_4").hide()
        }
    }else{
        $("#color_details_modal_color_sample").hide()
    }

    // full color bins
    if(currentColorTermData.fullBinsData){
        $("#color_details_modal_full_bins").show()
        $("#color_details_modal_full_bins_view").html(generateFullColorBinSvg(currentColorTermData.fullBinsData).node().outerHTML)
    }else{
        $("#color_details_modal_full_bins").hide()
    }

    // hue bins
    if(currentColorTermData.hueBinsData){
        $("#color_details_modal_hue_bins").show()
        $("#color_details_modal_hue_bins_line_view").html(generateHueColorSvg(currentColorTermData.hueBinsData).node().outerHTML)
        $("#color_details_modal_hue_bins_circle_view").html(generateHueColorRingSvg(currentColorTermData.hueBinsData).node().outerHTML)
    }else{
        $("#color_details_modal_hue_bins").hide()
    }

})

colorDetailsModalEl.addEventListener('show.bs.modal', event => {
  // TODO: ScrollTo
})


const downloadModal = new bootstrap.Modal('#download_modal', {})

$("#download_color_full_bins").click(e => {
    downloadModal.show()
})

$("#download_color_name_data").click(e => {
    //console.log(currentColorTermData.fullBinsData)
    const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentColorTermData.fullBinsData)
    //const jsonContent = "data:text/csv;charset=utf-8," + currentColorTermData.fullBinsData
    
    // based on:
    // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    
    var encodedUri = encodeURI(csvContent);
    //var encodedUri = encodeURI(jsonContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    //link.setAttribute("download", `${currentDatasetRgbSet}_summaries_${currentDatasetLangAbv}.csv`);
    link.setAttribute("download", `full_color_bins_summaries_${currentDatasetLangAbv}_${currentColorTermData.term}.csv`);
    document.body.appendChild(link); // Required for FF

    link.click();
})


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

$("#hue_bins_color_scale").change(() => {
    updateTableData()
    //redrawTable() // For some reason, this doesn't fix spacing issues
})


let currentDataset
let currentDatasetRgbSet
let currentDatasetLangAbv
$("#download_language_subset_button").click(e => {
    //const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentDataset)
    const jsonContent = "data:text/json;charset=utf-8," + JSON.stringify(currentDataset, null, 2)
    
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
    const basicNameInfoByLang = Object.groupBy(basicColorInfo, ({lang}) => lang)

        // make sure langAbvToLang table updated
    for(const [lang, colorSetData] of Object.entries(basicColorInfo)){
        langAbvToLang[colorSetData.lang_abv] = colorSetData.lang
    }

    
    if(rgbSet == "both-hue-full"){
        if(!allBothNamesByLang){
            const fullNameSetByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
            const hueNameSetByLang = Object.groupBy(hueColorNames, ({lang}) => lang)
            allBothNamesByLang = {}
            for(const lang of Object.keys(basicNameInfoByLang)){
                allBothNamesByLang[lang] = []
                let basicTermData = basicNameInfoByLang[lang]
                for(const termData of basicTermData){
                    const term = termData.simplifiedName
                    const langAbv = termData.lang_abv

                    const colorTermData =  getColorInfo(langAbv, term)

                    allBothNamesByLang[lang].push({
                        simplifiedName: term,
                        commonName: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.commonName : colorTermData.basicInfoTermRow.commonName,
                        lang_abv: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.lang_abv : colorTermData.basicInfoTermRow.lang_abv,
                        avgColorRGBCode: colorTermData.basicInfoTermRow.avgFullColorRGBCode,//fullTermRow ? basicInfoTermRow.avgFullColorRGBCode : undefined,
                        avgL: colorTermData.basicInfoTermRow.avgFullColorRGBCode ? (new Color(colorTermData.basicInfoTermRow.avgFullColorRGBCode).to("oklab")).l : undefined,
                        avgA: colorTermData.basicInfoTermRow.avgFullColorRGBCode ? (new Color(colorTermData.basicInfoTermRow.avgFullColorRGBCode).to("oklab")).a : undefined,
                        avgB: colorTermData.basicInfoTermRow.avgFullColorRGBCode ? (new Color(colorTermData.basicInfoTermRow.avgFullColorRGBCode).to("oklab")).b : undefined,
                        avgHueColor: colorTermData.basicInfoTermRow.avgHueRGBCode,// , hueTermRow ? hueTermRow.avgHueColor :
                        somColorPatch: colorTermData.somColorPatch,
                        totalColorFraction: colorTermData.fullTermRow ? colorTermData.fullTermRow.tinyResBlurTermFraction : undefined,
                        numFullNames: colorTermData.basicInfoTermRow.numFullNames,
                        numHueNames: colorTermData.basicInfoTermRow.numLineNames,
                        hueBinsData: colorTermData.hueBinsData,
                        fullBinsData: colorTermData.fullBinsData
                    })
                }
            }
        }
        color_set = allBothNamesByLang
    } else if(rgbSet == "full-data"){
        if(!allFullNamesByLang){
            allFullNamesByLang = {}
            const groupedLangFullNames = Object.groupBy(fullColorNames, ({lang}) => lang)
            for(const lang of Object.keys(groupedLangFullNames)){
                allFullNamesByLang[lang] = []
                for(const row of groupedLangFullNames[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName

                    const colorTermData = getColorInfo(langAbv, term)

                    allFullNamesByLang[lang].push({
                        simplifiedName: term,
                        commonName: colorTermData.commonName,
                        lang_abv: langAbv,
                        basicInfoTermRow: colorTermData,
                        numHueNames: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.numLineNames : undefined,
                        numFullNames: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.numFullNames : undefined,
                        somColorPatch: colorTermData.somColorPatch,
                        totalColorFraction: row.tinyResBlurTermFraction,
                        avgColorRGBCode: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.avgFullColorRGBCode : undefined,
                        fullBinsData: colorTermData.fullBinsData
                    })
                }
            }
        }
        color_set = allFullNamesByLang
    } else { // hue
        if(!allHueNamesByLang){
            allHueNamesByLang = {}
            const groupedLangHueNames = Object.groupBy(hueColorNames, ({lang}) => lang)
            for(const lang of Object.keys(groupedLangHueNames)){
                allHueNamesByLang[lang] = []
                for(const row of groupedLangHueNames[lang]){
                    const langAbv = row.lang_abv
                    const term = row.simplifiedName

                    const colorTermData = getColorInfo(langAbv, term)
                    
                    allHueNamesByLang[lang].push({
                        simplifiedName: term,
                        commonName: colorTermData.commonName,
                        lang_abv: langAbv,
                        basicInfoTermRow: colorTermData,
                        numHueNames: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.numLineNames : undefined,
                        numFullNames: colorTermData.basicInfoTermRow ? colorTermData.basicInfoTermRow.numFullNames : undefined,
                        somColorPatch: colorTermData.somColorPatch,
                        totalColorFraction: row.tinyResBlurTermFraction,
                        avgHueColor: colorTermData.basicInfoTermRow.avgHueRGBCode,
                        hueBinsData: colorTermData.hueBinsData
                    })
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
        formatter: (cell, row, col) => gridjs.html(`<p style="margin-bottom:0px" translate="no" class="notranslate">${escapeHTML(cell.commonName)}
            <p style="margin-bottom:0px" class="simplified-name" translate="no" class="notranslate">${escapeHTML(cell.simplifiedName)}</p>`)
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
                if("avgL" in a && a.avgL){
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
                <div style="white-space:nowrap" data-bs-toggle="modal" data-bs-target="#color_details_modal" data-lang="${cell.lang_abv}" data-color-name="${nameToUnicode(cell.simplifiedName)}">
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

let hueOffset = 0

function generateHueColorSvg(hueData){
    combineHueBinDataWithColors(hueData)

    const width = 200,
        height = cellHeight

    let hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", "hue-color-svg")
        .attr("color-name-id", `${hueData.langAbv}_${nameToUnicode(hueData.simplifiedName)}`)

    let spectrumN = hueData.bins.length;

    //extend hue Data: 72 or 36 by 1/9th
    const goalHorizontalExtend = 1/9
    const horizontalExtendBins = Math.round(spectrumN * goalHorizontalExtend)

    const totalBins = spectrumN + 2 * horizontalExtendBins
    const binWidth = width / totalBins
    const minBinCenter = binWidth / 2
    const maxBinCenter = width - binWidth / 2

    let x = d3.scaleLinear()
        .range([minBinCenter, maxBinCenter])

    x.domain([0 - horizontalExtendBins, spectrumN - 1 + horizontalExtendBins]);

    const maxPCT = Math.max(...hueData.bins.map(b => b.pCT))


    let colorScaleSpace = 0
    let colorScaleHeight = 0
    if($("#hue_bins_color_scale").is(":checked")){
        colorScaleSpace = .05 * height
        colorScaleHeight = .1 * height
    }
    
    let y = d3.scaleLinear()
        .range([0, height - colorScaleSpace - colorScaleHeight]);


    y.domain([0,maxPCT]);
    //y.domain([0,1]);

    let yAxis = d3.axisLeft()
        .scale(y);

    updateHueColorSvg(hueBinSvg)

    // add lines to show beginning/end of hue range (before repeats)
    hueBinSvg
        .append("line")
        .attr("x1", x(- 1/2)) // left edge of the main range 
        .attr("x2", x(- 1/2)) 
        .attr("y1", 0) 
        .attr("y2", height)
        .style("stroke", "rgba(0,0,0,0.3)")
        .style("stroke-width", "1")


    hueBinSvg
        .append("line")
        .attr("x1", x(spectrumN - 1 + 1/2)) // right edge of the main range 
        .attr("x2", x(spectrumN - 1 + 1/2)) // right edge of extendBins
        .attr("y1", 0) 
        .attr("y2", height)
        .style("stroke", "rgba(0,0,0,0.3)")
        .style("stroke-width", "1")


    function updateHueColorSvg(svg){
        if(!svg){
            svg = d3.select(`svg[color-name-id=${hueData.langAbv}_${nameToUnicode(hueData.simplifiedName)}]`)
        }

        const hueOffsetInBins = hueOffset * x.domain()[1] / x.range()[1]
 
        const maxRepeatFade = 0.25
        const repeatFadeScale = d3.scaleLinear()
        .range([maxRepeatFade, 0])
        .domain([-1/2, - horizontalExtendBins]);

        function getBinLeftEdgeWithinRange(bin_i){
            let leftEdge = parseInt(bin_i) - 1/2 + hueOffsetInBins
            while(leftEdge < -1/2 || leftEdge >= spectrumN - 1/2){
                if(leftEdge < -1/2){
                    leftEdge += spectrumN
                } 
                if(leftEdge >= spectrumN -1/2){
                    leftEdge -= spectrumN
                } 
            }
            return leftEdge
        }

        function getBinRightEdgeWithinRange(bin_i){
            let rightEdge = parseInt(bin_i) + 1/2 + hueOffsetInBins

            while(rightEdge < -1/2 || rightEdge >= spectrumN - 1/2){
                if(rightEdge < -1/2){
                    rightEdge += spectrumN
                } 
                if(rightEdge >= spectrumN -1/2){
                    rightEdge -= spectrumN
                } 
            }
            return rightEdge
        }

        if($("#hue_bins_color_scale").is(":checked")){
            const colorScalePatchG = svg.selectAll(".color_scale_patch_g")
                .data(hueData.bins)
                .join("g")
                .attr("class", "color_scale_patch_g")

            
            // color patch left faded if relevant
            colorScalePatchG
                .selectAll(".color_scale_patch_fade_left")
                .data(d => [d])
                .join("rect")
                .attr("class", "color_scale_patch_fade_left")
                .attr("display", d => 
                    getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN > -horizontalExtendBins - 1
                    ? undefined : "none")
                .attr("x", d => x(getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN ))
                .attr("y", height - colorScaleHeight)
                .attr("width", d => {
                    let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                    if(width < 0){
                        width = x(-1/2) - x((getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN ))
                    }
                    return width >= 0 ? width : 0
                })
                .attr("height", colorScaleHeight)
                .attr("fill", d => {
                    const color = d3.color(d.binColorStr)
                    color.opacity = repeatFadeScale(getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN)
                    return color
                })
            
            //main color patch (left)
            colorScalePatchG
                .selectAll(".color_scale_patch_main_left")
                .data(d => [d])
                .join("rect")
                .attr("class", "color_scale_patch_main_left")
                .attr("x", d => 
                    getBinLeftEdgeWithinRange(d.colorBin.bin_i) < getBinRightEdgeWithinRange(d.colorBin.bin_i) ? 
                    x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)) :
                    x(-1/2)
                )
                .attr("y", height - colorScaleHeight)
                .attr("width", d => {
                    let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                    if(width < 0){
                        width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(-1/2)
                    }
                    return width >= 0 ? width : 0
                })
                .attr("height", colorScaleHeight)
                .attr("fill", d => d.binColorStr)

            // main color patch right (if a second is needed)
             colorScalePatchG
                .selectAll(".color_scale_patch_main_right")
                .data(d => [d])
                .join("rect")
                .attr("class", "color_scale_patch_main_right")
                .attr("display", d => 
                   getBinLeftEdgeWithinRange(d.colorBin.bin_i) > getBinRightEdgeWithinRange(d.colorBin.bin_i)
                     ? undefined : "none")
                .attr("x", d => x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)))
                .attr("y", height - colorScaleHeight)
                .attr("width", d => x(spectrumN - 1/2) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)))
                .attr("height", colorScaleHeight)
                .attr("fill", d => d.binColorStr)


            // color patch right faded if relevant
            colorScalePatchG
                .selectAll(".color_scale_patch_fade_right")
                .data(d => [d])
                .join("rect")
                .attr("class", "color_scale_patch_fade_right")
                .attr("display", d => 
                    getBinRightEdgeWithinRange(d.colorBin.bin_i) + spectrumN < spectrumN - 1 + horizontalExtendBins + 1
                    ? undefined : "none")
                .attr("x", d => 
                    getBinLeftEdgeWithinRange(d.colorBin.bin_i) < getBinRightEdgeWithinRange(d.colorBin.bin_i) ? 
                    x(getBinLeftEdgeWithinRange(d.colorBin.bin_i) + spectrumN) :
                    x(spectrumN -1/2)
                )
                .attr("y", height - colorScaleHeight)
                .attr("width", d => {
                    let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                    if(width < 0){
                        width = x((getBinRightEdgeWithinRange(d.colorBin.bin_i) + spectrumN )) - x(spectrumN - 1/2)
                    }
                    return width >= 0 ? width : 0
                })
                .attr("height", colorScaleHeight)
                .attr("fill", d => {
                    const color = d3.color(d.binColorStr)
                    color.opacity = repeatFadeScale(-getBinRightEdgeWithinRange(d.colorBin.bin_i))
                    return color
                })
                
        }

        const colorPatchG = svg.selectAll(".color_patch_g")
            .data(hueData.bins.filter(d => d.pCT > 0))
            .join("g")
            .attr("class", "color_patch_g")
        
        // fade left
        colorPatchG.selectAll(".color_patch_main_fade_left")
            .data(d => [d])
            .join("rect")
            .attr("class", "color_patch_main_fade_left")
            .attr("display", d => 
                    getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN > -horizontalExtendBins - 1
                    ? undefined : "none")
            .attr("x", d => x(getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN ))
            .attr("y",  d => height - colorScaleSpace - colorScaleHeight - y(d.pCT))//d => y(d.pCT))
            .attr("width", d => {
                let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                if(width < 0){
                    width = x(-1/2) - x((getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN ))
                }
                return width >= 0 ? width : 0
            })
            .attr("height", d => y(d.pCT))
            .attr("fill", d => {
                const color = d3.color(d.binColorStr)
                color.opacity = repeatFadeScale(getBinLeftEdgeWithinRange(d.colorBin.bin_i) - spectrumN)
                return color
            })

        // main left
        colorPatchG.selectAll(".color_patch_main_left")
            .data(d => [d])
            .join("rect")
            .attr("class", "color_patch_main_left")
            .attr("x", d => 
                getBinLeftEdgeWithinRange(d.colorBin.bin_i) < getBinRightEdgeWithinRange(d.colorBin.bin_i) ? 
                x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)) :
                x(-1/2)
            )
            .attr("y",  d => height - colorScaleSpace - colorScaleHeight - y(d.pCT))//d => y(d.pCT))
            .attr("width", d => {
                let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                if(width < 0){
                    width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(-1/2)
                }
                return width >= 0 ? width : 0
            })
            .attr("height", d => y(d.pCT))
            .attr("fill", d => d.binColorStr)

        // main right
        colorPatchG.selectAll(".color_patch_main_right")
            .data(d => [d])
            .join("rect")
            .attr("class", "color_patch_main_right")
            .attr("display", d => 
                getBinLeftEdgeWithinRange(d.colorBin.bin_i) > getBinRightEdgeWithinRange(d.colorBin.bin_i)
                    ? undefined : "none")
            .attr("x", d => x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)))
            .attr("y",  d => height - colorScaleSpace - colorScaleHeight - y(d.pCT))//d => y(d.pCT))
            .attr("width", d => x(spectrumN - 1/2) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i)))
            .attr("height", d => y(d.pCT))
            .attr("fill", d => d.binColorStr)

        // fade right
        colorPatchG.selectAll(".color_patch_main_fade_right")
            .data(d => [d])
            .join("rect")
            .attr("class", "color_patch_main_fade_right")
            .attr("display", d => 
                getBinRightEdgeWithinRange(d.colorBin.bin_i) + spectrumN < spectrumN - 1 + horizontalExtendBins + 1
                ? undefined : "none")
            .attr("x", d => 
                getBinLeftEdgeWithinRange(d.colorBin.bin_i) < getBinRightEdgeWithinRange(d.colorBin.bin_i) ? 
                x(getBinLeftEdgeWithinRange(d.colorBin.bin_i) + spectrumN) :
                x(spectrumN -1/2)
            )
            .attr("y",  d => height - colorScaleSpace - colorScaleHeight - y(d.pCT))//d => y(d.pCT))
            .attr("width", d => {
                let width = x(getBinRightEdgeWithinRange(d.colorBin.bin_i)) - x(getBinLeftEdgeWithinRange(d.colorBin.bin_i))
                if(width < 0){
                    width = x((getBinRightEdgeWithinRange(d.colorBin.bin_i) + spectrumN )) - x(spectrumN - 1/2)
                }
                return width >= 0 ? width : 0
            })
            .attr("height", d => y(d.pCT))
            .attr("fill", d => {
                const color = d3.color(d.binColorStr)
                color.opacity = repeatFadeScale(-getBinRightEdgeWithinRange(d.colorBin.bin_i))
                return color
            })
    }

    const hueBinSvgSelect = d3.select(`svg[color-name-id=${hueData.langAbv}_${nameToUnicode(hueData.simplifiedName)}]`)
    hueBinSvgSelect.call(d3.drag()
        //.on("start", dragstarted)
        .on("drag", dragged)
        //.on("end", dragended)
    ) 

    
    function dragstarted(event) {
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        hueOffset += event.dx
        updateHueColorSvg()
    }

    function dragended(event) {
    }
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

    const centerColorScaleRadius = centerRadius *.7
    const centerColorScaleBandWidth = centerRadius *.15

    let binWidthScale = d3.scaleLinear()
        .range([0, bandWidth]);
    const maxPCT = Math.max(...hueData.bins.map(b => b.pCT))
    binWidthScale.domain([0,maxPCT]);

    if($("#hue_bins_color_scale").is(":checked")){
        hueBinSvg.selectAll(".color_scale_patch")
            .data(hueData.bins)
            // .data(hueData.bins)
            .join("path")
            .attr("class", "color_scale_patch")
            .attr("d", d => {
                const startBinI = (d.colorBin.bin_i-1) % spectrumN
                const endBinI = d.colorBin.bin_i 

                const binWidth = centerColorScaleBandWidth

                const correctedRadius = centerColorScaleRadius + binWidth / 2
                
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
            .style("stroke-width", centerColorScaleBandWidth)
            .attr("stroke", d => d.binColorStr)
    } else {
        hueBinSvg.append("circle")
            .attr("cx", width/2)
            .attr("cy", height/2)
            .attr("r", centerRadius)
            .attr("fill", "rgba(128,128,128,0.1)")
    }

    

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


    const maxPCT = Math.max(...fullData.map(d => d.pCT))

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

            return binData ? 1.5 * Math.sqrt(binData.pCT / maxPCT) : 0         
        },
    })

    return hueBinSvg
}




