import BinSize from "../../shared_files/binSize.js";
import FullColorBinView from "./full-color-bin-view.js";

// enable popover library
const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))


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


//based on https://coreui.io/blog/how-to-check-if-an-element-is-visible-in-javascript/
const isVisibleInViewport = (element) => {
    const rect = element.getBoundingClientRect()
    return (
        // no margin version
        // rect.bottom >= 0 &&
        // rect.right >= 0 &&
        // rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        // rect.left <= (window.innerWidth || document.documentElement.clientWidth)

        // extra margin version
        rect.bottom >= -0.5*(window.innerHeight || document.documentElement.clientHeight)  &&
        rect.right >= -0.5*(window.innerWidth || document.documentElement.clientWidth) &&
        rect.top <= 1.5*(window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= 1.5*(window.innerWidth || document.documentElement.clientWidth)
    )
}

const cellHeight = 60
let hueOffset = 0

// load basic color info
const allColorInfo = await d3.csv("../model/basic_colors_info.csv");
// store temporary filtered and sorted info for display
let filteredColorInfo,
    sortedColorInfo

const langAbvToLang = {}
for(const colorInfo of allColorInfo){
    if(!(colorInfo.lang_abv in langAbvToLang)){
        langAbvToLang[colorInfo.lang_abv] = colorInfo.lang
    }
}

let prev_selected_lang_abv = "ko"
$("#selected_langs").empty()
$("#selected_langs").append(new Option("All languages", "allLang", true, false))
for(const langAbv of Object.keys(langAbvToLang).sort()){
    const lang = langAbvToLang[langAbv]
    $("#selected_langs").append(new Option(lang, langAbv, true, langAbv == prev_selected_lang_abv))
}


// start async loading of additional color info
let hueColorInfo,
    fullColorNames,
    colorSampleSOMs,
    hueBins36,
    hueBins72,
    colorSampleHueBins36BlurByLang,
    colorSampleHueBins72BlurByLang,
    fullBinsInfo,
    colorSampleFullBins


d3.csv("../model/hue_colors_info.csv").then((data) => {
    hueColorInfo = data
    const hueNameSetByLang = Object.groupBy(hueColorInfo, ({lang}) => lang)
    for(const colorInfo of allColorInfo){
        const lang = colorInfo.lang
        const term = colorInfo.simplifiedName
        const hueTermRow =  lang in hueNameSetByLang ? hueNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
        if(hueTermRow){
            colorInfo.hueColorInfo = hueTermRow
        }
    }
    sortFilteredData()
})
d3.csv("../model/full_colors_info.csv").then((data) => {
    fullColorNames = data
    const fullNameSetByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
    for(const colorInfo of allColorInfo){
        const lang = colorInfo.lang
        const term = colorInfo.simplifiedName
        const fullTermRow =  lang in fullNameSetByLang ? fullNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
        if(fullTermRow){
            colorInfo.fullColorInfo = fullTermRow
        }
    }
    sortFilteredData()
})
fetch("../model/colorSOMPatches.json").then(async (response) => {
    colorSampleSOMs = await response.json()
    for(const colorInfo of allColorInfo){
        const langAbv = colorInfo.lang_abv
        const term = colorInfo.simplifiedName
        const somColorPatch = colorSampleSOMs && langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined
        if(somColorPatch){
            colorInfo.somColorPatch = somColorPatch
        }
    }
    updateTable()
})
d3.csv("../model/color_info_pre_naming/hue_color_bins_36_rgb.csv").then((data) => {
    hueBins36 = data
    updateTable()
})
d3.csv("../model/color_info_pre_naming/hue_color_bins_72_rgb.csv").then((data) => {
    hueBins72 = data
    updateTable()
})
fetch("../model/binned_hue_colors/hue_color_names_binned_36_blur.json").then(async (response) => {
    colorSampleHueBins36BlurByLang = await response.json()
    for(const colorInfo of allColorInfo){
        const langAbv = colorInfo.lang_abv
        const term = colorInfo.simplifiedName
        const hueBins36BlurData = colorSampleHueBins36BlurByLang && langAbv in colorSampleHueBins36BlurByLang && term in colorSampleHueBins36BlurByLang[langAbv] ? colorSampleHueBins36BlurByLang[langAbv][term] : undefined
        if(hueBins36BlurData){
            hueBins36BlurData.langAbv = langAbv
            colorInfo.hueBins36BlurData = hueBins36BlurData
        }
    }
    updateTable()
})
fetch("../model/binned_hue_colors/hue_color_names_binned_72_blur.json").then(async (response) => {
    colorSampleHueBins72BlurByLang = await response.json()
    for(const colorInfo of allColorInfo){
        const langAbv = colorInfo.lang_abv
        const term = colorInfo.simplifiedName
        const hueBins72BlurData = colorSampleHueBins72BlurByLang && langAbv in colorSampleHueBins72BlurByLang && term in colorSampleHueBins72BlurByLang[langAbv] ? colorSampleHueBins72BlurByLang[langAbv][term] : undefined
        if(hueBins72BlurData){
            hueBins72BlurData.langAbv = langAbv
            colorInfo.hueBins72BlurData = hueBins72BlurData
        }
    }
    updateTable()
})
fetch(`../model/color_info_pre_naming/oklab_bins_${fullBinSize}.json`).then(async (response) => {
    // const fullBinsData = colorSampleFullBins && lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
    //     colorSampleFullBins[lang][term] : undefined

    const fullBinsInfoAllSpaces = await response.json()
    fullBinsInfo = fullBinSize.filterBinsByGamut(fullBinsInfoAllSpaces, "rgb")  //assume just rgb bins
    updateTable()
})
fetch(`../model/binned_full_colors/full_color_names_binned_blur_${fullBinSize}.json.gz`).then(async (response) => {
    const colorSampleFullBinsZipped =  await response.arrayBuffer()
    const colorSampleFullBinsFlat = JSON.parse(pako.ungzip(colorSampleFullBinsZipped,{ to: 'string' }))

    const colorSampleFullBinsGrouped = d3.groups(colorSampleFullBinsFlat, d => d.lang, d => d.term)
        .map(a => {return {key: a[0], values: a[1].map(b => {return{key: b[0], values: b[1]}}) }})

    colorSampleFullBins = {}
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

    for(const colorInfo of allColorInfo){
        const lang = colorInfo.lang
        const term = colorInfo.simplifiedName
        const fullBinsData = colorSampleFullBins && lang in colorSampleFullBins && term in colorSampleFullBins[lang] ? colorSampleFullBins[lang][term] : undefined
        if(fullBinsData){
            colorInfo.fullBinsData = fullBinsData
        }
    }

    updateTable()
})



function getHueBinInfo(langAbv, term){
    const hueBinsData = colorSampleHueBins72BlurByLang && langAbv in colorSampleHueBins72BlurByLang && term in colorSampleHueBins72BlurByLang[langAbv] ?
        colorSampleHueBins72BlurByLang[langAbv][term] : 
            colorSampleHueBins36BlurByLang && langAbv in colorSampleHueBins36BlurByLang && term in colorSampleHueBins36BlurByLang[langAbv] ?
            colorSampleHueBins36BlurByLang[langAbv][term] : undefined

    if(hueBinsData){
        hueBinsData.langAbv = langAbv
    }

    return hueBinsData
}

function getFullBinInfo(langAbv, term){
    const lang = langAbvToLang[langAbv]
    const fullBinsData = colorSampleFullBins && lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
        colorSampleFullBins[lang][term] : undefined

    return fullBinsData
}

function getColorInfo(langAbv, term){
    const lang = langAbvToLang[langAbv]

    const basicNameInfoByLang = Object.groupBy(allColorInfo, ({lang}) => lang)
    const fullNameSetByLang = Object.groupBy(fullColorNames, ({lang}) => lang)
    const hueNameSetByLang = Object.groupBy(hueColorInfo, ({lang}) => lang)

    const basicInfoTermRow =  lang in basicNameInfoByLang ? basicNameInfoByLang[lang].find(d => d.simplifiedName == term) : undefined
    const hueTermRow =  lang in hueNameSetByLang ? hueNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
    const fullTermRow =  lang in fullNameSetByLang ? fullNameSetByLang[lang].find(d => d.simplifiedName == term) : undefined
    const somColorPatch = colorSampleSOMs && langAbv in colorSampleSOMs && term in colorSampleSOMs[langAbv] ? colorSampleSOMs[langAbv][term] : undefined

    const hueBinsData = getHueBinInfo(langAbv, term)

    const fullBinsData = colorSampleFullBins && lang in colorSampleFullBins && term in colorSampleFullBins[lang] ?
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
        $("#color_details_modal_full_num_entries").text(currentColorTermData.basicInfoTermRow.numFullNames)
    } else {
        $("#color_details_modal_full_details").hide()
    }
    if(currentColorTermData.hueTermRow){
        $("#color_details_modal_hue_details").show()
        $("#color_details_modal_hue_perc").text(currentColorTermData.hueTermRow.lowResBlurTermFraction * 100)
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
        $("#color_details_modal_hue_bins_line_view").html(generateHueColorSvg(currentColorTermData.hueBinsData, true).node().outerHTML)
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
    updateData()
})

$("#search-input").on('input', updateFilteredData)

$("input:radio[name=rgb-set]").change(e => { 
    updateRgbSet()
})

$("#hue_bins_in_circle").change(() => {
    updateData()
})

$("#hue_bins_color_scale").change(() => {
    updateData()
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

// create data table
$("#loading-data-span").hide()
//$("#data-table").append("<table>")

// html scrolling table
// https://stackoverflow.com/questions/17067294/html-table-with-100-width-with-vertical-scroll-inside-tbody


//tmp solution
let rgbSet = "both-hue-full"

function namePercentSort(a, b){
    const aTotalColorFraction = a.fullColorInfo ? a.fullColorInfo.tinyResBlurTermFraction : undefined
    const bTotalColorFraction = b.fullColorInfo ? b.fullColorInfo.tinyResBlurTermFraction : undefined
    if(aTotalColorFraction){
        if(bTotalColorFraction){
            const diff = bTotalColorFraction - aTotalColorFraction
            // for some reason sort fails if these are small values, so make them bigger
            const returnVal = diff < 0 ? -1 : diff > 0 ? 1 : 0
            return returnVal
        } else {
            return -1
        }
    } else {
        if(bTotalColorFraction){
            return 1
        } else {
            return parseFloat(b.numHueNames) - parseFloat(a.numHueNames)
        }
    }
}

const tableCols = [
    {
        id: "commonName",
        key: "commonName",
        headerHTML: `<p style="margin-bottom:0px">Name</p>
                    <p style="margin-bottom:0px" class="simplified-name">simplified name</p>`,
        formatter: (cell, row) => 
             `<p style="margin-bottom:0px" translate="no" class="notranslate">${escapeHTML(row.commonName)}
             <p style="margin-bottom:0px" class="simplified-name" translate="no" class="notranslate">${escapeHTML(row.simplifiedName)}</p>`
    },
    {
        id: "avgColor",
        key: "avgFullColorRGBCode",
        headerHTML: `
            <p style="margin-bottom:0px">Avg Color</p>
            <p class="simplified-name" style="margin-bottom:0px">${rgbSet == "both-hue-full" ? "full / hue" : rgbSet == "full-data" ? "full" : "hue"}</p>`,
        compare: (a, b) => {
            let a_h, b_h
            if("avgFullL" in a && a.avgFullL){
                a_h = new Color({space: "oklab", coords: [a.avgFullL, a.avgFullA, a.avgFullB]}).to("oklch").h
            } else {
                a_h = new Color(a.avgHueRGBCode).to("oklch").h
            }
            if("avgFullL" in b && b.avgFullL){
                b_h = new Color({space: "oklab", coords: [b.avgFullL, b.avgFullA, b.avgFullB]}).to("oklch").h
            } else {
                b_h = new Color(b.avgHueRGBCode).to("oklch").h
            }
            return a_h - b_h
        },
        formatter: (cell, row) => {
            return `
                <div style="white-space:nowrap" data-bs-toggle="modal" data-bs-target="#color_details_modal" data-lang="${row.lang_abv}" data-color-name="${nameToUnicode(row.simplifiedName)}">
                    ${rgbSet == "both-hue-full" || rgbSet == "full-data" ? `
                        <div
                            style="height:${cellHeight/2}px; width: ${cellHeight/2}px; border-radius: ${cellHeight/4}px; display: inline-block; margin: 5px;
                            background-color:${row.avgFullColorRGBCode ? row.avgFullColorRGBCode : "rgba(0,0,0,0)"};" title="${escapeHTML(row.avgFullColorRGBCode ? row.avgFullColorRGBCode : "")}" >
                        </div>` : ""
                    }
                    ${rgbSet == "both-hue-full" ? `<div style="height:${cellHeight/2}px; width:0px; display: inline-block; margin:5px; border:solid rgba(128,128,128,0.5) 1px"></div>` : ""}
                    ${rgbSet == "both-hue-full" || rgbSet == "hue-data" ? `
                        <div
                            style="height:${cellHeight/2}px; width: ${cellHeight/2}px; border-radius: ${cellHeight/4}px; display: inline-block; margin: 5px;
                            background-color:${row.avgHueRGBCode ? row.avgHueRGBCode : "rgba(0,0,0,0)"};" title="${escapeHTML(row.avgHueRGBCode ? row.avgHueRGBCode : "")}" >
                        </div>` : ""
                    }
                </div>`
        }
    },
    {
        key: "somColorPatch",
        headerHTML: "Sample",
        sort: false,
        formatter: (cell, row) => {
            if(!cell){
                return ""
            }
            return 'colorNodes16' in cell ? generateColorGrid(cell.colorNodes16) :
                   'colorNodes9' in cell ?  generateColorGrid(cell.colorNodes9) :
                   generateColorGrid(cell.colorNodes4)
        }
    },
    {
        key: "fullBinsData",
        headerHTML: "Full Bins",
        width: "262px",
        sort: false,
        formatter: (cell, row) => { //TODO: REMOVE
            return cell ? generateFullColorBinSvg(cell).node().outerHTML : ""
        },
        d3Formatter: d3SvgUpdateFullColorBins
            
    },
    {
        headerHTML: "Hue Bins",
        sort: false,
        formatter: (cell, row) => { //TODO: REMOVE
            //TODO: get hue Bins data
            //const hueBinData = getHueBinData(row)
            const hueBinData = row.hueBins72BlurData ? row.hueBins72BlurData : row.hueBins36BlurData
            if(!hueBinData){
                return "" // TODO: loading
            }
            if($("#hue_bins_in_circle").is(':checked')){
                return generateHueColorRingSvg(hueBinData).node().outerHTML
            } else {
                return generateHueColorSvg(hueBinData).node().outerHTML
            }
        },
        d3Formatter: d3SvgUpdateHueColor
        //todo: drag
    },
    {
        id: "NamePercent",
        headerHTML: "% of names",
        //sort:  {
        compare: namePercentSort,
        //},
        formatter: (cell, row, col) => {
            // TODO : redo logic
            const totalColorFraction = row.fullColorInfo ? row.fullColorInfo.tinyResBlurTermFraction : undefined
            if(totalColorFraction){
                return (totalColorFraction * 100).toPrecision(3) / 1 + "%"
            } else {
                return row.numLineNames + " hue names"
            }
        }
    }
]


function updateFilteredData(){
    // filter by language
    const lang_abv = $("#selected_langs").val()
    if(lang_abv == "allLang"){
        filteredColorInfo = allColorInfo
    } else{
        filteredColorInfo = allColorInfo.filter((t) => t.lang_abv == lang_abv)
    }
    
    
    // filter by search term
    const search_str = $("#search-input").val()
    const searches = search_str.split(";").map(s => s.split(/\s+/))

    // if there is a search, restrict results, otherwise show all
    if(searches.length > 1 || searches[0].length > 0){
        filteredColorInfo = filteredColorInfo.filter((t) => {
            let matchAnySearch = false
            for(const search of searches){ // see if it matches any of the searches
                // must match all parts in the search
                let matchAll = true
                for(const searchPart of search){
                    if(searchPart.length > 1 && 
                        !t.lang.includes(searchPart) &&
                        !t.commonName.includes(searchPart)
                    ){
                        matchAll = false
                    }
                }
                if(matchAll){
                    matchAnySearch = true
                    return true
                }
            }
            return false
        })
    }

    sortFilteredData()
    
}

function sortFilteredData(){
    if(!filteredColorInfo){
        return
    }
    const sortColumn = tableCols[tableCols.length - 1]
    const sortDirection = -1
    sortedColorInfo = filteredColorInfo.sort((a, b) => sortColumn.compare ? sortColumn.compare(a, b) : 
        a[sortColumn.key] < b[sortColumn.key] ? sortDirection :
        a[sortColumn.key] > b[sortColumn.key] ? - sortDirection:
        1)
    updateTable()
}

function updateTable(){

    if(!sortedColorInfo){
        return
    }
    
    const headerRow = d3.select("#data-table thead tr")
    headerRow.selectAll(".table-headers")
        .data(tableCols)
        .join("th")
        .attr("class", "table-headers")
        .html(d => d.headerHTML)

    const tableBody = d3.select("#data-table tbody")
    const nameRows = tableBody.selectAll(".name-row")
        .data(sortedColorInfo)
        .join("tr")
        .attr("class", "name-row")

    const tableCell = nameRows.selectAll(".name-cell")
            .data(d => tableCols.map(col => {
                    return {cell: d[col.key], row: d, tableCol: col}
                }))
            .join("td")
            .attr("class", "name-cell")
    
    // for any cells with a d3 formatter use that
    const d3Formatters = tableCols.filter(tableCol => tableCol.d3Formatter).map(tableCol => tableCol.d3Formatter)
    for(const d3Formatter of d3Formatters){
        d3Formatter(
            tableCell.filter((d) => d.tableCol.d3Formatter === d3Formatter)
        )
    }

    // for the rest of the cells without a d3 formatter, set the html:
    tableCell.filter((d) => !d.tableCol.d3Formatter)
                .html((d) => {
            return d.tableCol.formatter ? d.tableCol.formatter(d.cell, d.row) : d.cell
        })
}

function updateData() {



    updateRgbSet()
}

updateData()


function updateRgbSet(){
    // const rgbSet = $("input[name='rgb-set']:checked").val()


    // let prev_selected_lang = $("#selected_langs").val()
    // if(!prev_selected_lang){
    //     prev_selected_lang = "Korean (한국어, 조선어)"
    // }
    // if(!Object.keys(color_set).includes(prev_selected_lang)){
    //     prev_selected_lang = Object.keys(color_set).sort()[0]
    // }
    // $("#selected_langs").empty()
    // for(const lang of Object.keys(color_set).sort()){
    //     $("#selected_langs").append(new Option(lang, lang, true, lang == prev_selected_lang))
    // }

    updateFilteredData()

    // const selected_lang = $("#selected_langs").val()
    // if(!selected_lang){
    //     return
    // }

    //$("#loading-data-span").hide()
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


function refreshAllSvgs(){
    refreshHueSvgs()
    refreshFullSvgs()
}

function refreshHueSvgs(){
    const isModal = ""
    for(const hueColorSVG of $(`.hue-color-svg${isModal}`)){
        updateHueColorSvg(d3.select(hueColorSVG))
    }
}

function refreshFullSvgs(){
    const isModal = ""
    for(const fullColorSVG of $(`.full-color-svg${isModal}`)){
        updateFullColorBinSvg(d3.select(fullColorSVG))
    }
}

$("#data-view").on("scroll", refreshAllSvgs)
$( window ).on( "resize", refreshAllSvgs)

function updateHueColorSvg(svg){
    const langAbv = svg.attr("data-lang")
    const term = nameFromUnicode(svg.attr("data-color-name"))
    const width = svg.attr("width")
    const height = svg.attr("height")

    // if svg not on screen, leave empty
    if(!isVisibleInViewport(svg.node())){
        svg.html("")
        return
    }

    const hueData = getHueBinInfo(langAbv, term)

    
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

    // add lines to show beginning/end of hue range (before repeats)
    svg.selectAll(".hue-line-begin-range")
        .data([{id: "begin"}])
        .join("line")
        .attr("class", "hue-line-begin-range")
        .attr("x1", x(- 1/2)) // left edge of the main range 
        .attr("x2", x(- 1/2)) 
        .attr("y1", 0) 
        .attr("y2", height)
        .style("stroke", "rgba(0,0,0,0.3)")
        .style("stroke-width", "1")


    svg.selectAll(".hue-line-end-range")
        .data([{id: "end"}])
        .join("line")
        .attr("class", "hue-line-end-range")
        .attr("x1", x(spectrumN - 1 + 1/2)) // right edge of the main range 
        .attr("x2", x(spectrumN - 1 + 1/2)) // right edge of extendBins
        .attr("y1", 0) 
        .attr("y2", height)
        .style("stroke", "rgba(0,0,0,0.3)")
        .style("stroke-width", "1")

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
}

function d3SvgUpdateHueColor(d3selection, isModal) {
    isModal = isModal ? "-modal" : ""

    const width = 200,
        height = cellHeight

    const hueBinSvgs = d3selection.selectAll("svg")
        .data((d) => {
            if(d.row.hueBins36BlurData){
                combineHueBinDataWithColors(d.row.hueBins36BlurData)
            }
            if(d.row.hueBins72BlurData){
                combineHueBinDataWithColors(d.row.hueBins72BlurData)
                return [d.row.hueBins72BlurData]
            }
            if(d.row.hueBins36BlurData){
                return [d.row.hueBins36BlurData]
            }
            return []
        })
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `hue-color-svg${isModal}`)
        .style("cursor", "grab")
        .attr("data-lang", (d) => d.langAbv) 
        .attr("data-color-name", (d) => nameToUnicode(d.simplifiedName))

    
    hueBinSvgs.each(function() {
        const hueBinSvg = d3.select(this)

        updateHueColorSvg(hueBinSvg)

        hueBinSvg.call(d3.drag()
            .on("drag", dragged)
        ) 

        // Update the subject (dragged node) position during drag.
        function dragged(event) {
            hueOffset += event.dx
            //update all hue color svgs
            refreshHueSvgs()
        }
    })
}

// TODO: Hopefully remove this function
function generateHueColorSvg(hueData, isModal){
    isModal = isModal ? "-modal" : ""

    combineHueBinDataWithColors(hueData)

    const width = 200,
        height = cellHeight

    let hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
        .attr("content-visibility", "auto")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `hue-color-svg${isModal}`)
        .attr("data-lang", hueData.langAbv) 
        .attr("data-color-name", nameToUnicode(hueData.simplifiedName))


    updateHueColorSvg(hueBinSvg)


    const hueBinSvgSelect = d3.select(`svg.hue-color-svg${isModal}[data-color-name="${nameToUnicode(hueData.simplifiedName)}"][data-lang=${hueData.langAbv}]`)
    hueBinSvgSelect.call(d3.drag()
        //.on("start", dragstarted)
        .on("drag", dragged)
        //.on("end", dragended)
    ) 

    
    function dragstarted(event) {
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        console.log("test")
        hueOffset += event.dx
        //update all hue color svgs
        for(const hueColorSVG of $(`.hue-color-svg${isModal}`)){
            updateHueColorSvg(d3.select(hueColorSVG))
        }
    }

    function dragended(event) {
    }
    return hueBinSvg
}


function generateHueColorRingSvg(hueData){
    combineHueBinDataWithColors(hueData)

    const width = cellHeight,
        height = cellHeight

    const hueBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
    
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

function d3SvgUpdateFullColorBins(d3selection, isModal) {
    isModal = isModal ? "-modal" : ""

    const maxWidth = 300,
        maxHeight = cellHeight


    const width = maxWidth
    const height = maxHeight

    
    /////////////////

    const fullBinSvgs = d3selection.selectAll("svg")
        .data((d) => {
            if(d.row.fullBinsData){
                return [d.row.fullBinsData]
            }
            return []
        })
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `full-color-svg${isModal}`)
        .attr("data-lang", (d) => d[0].langAbv) 
        .attr("data-color-name", (d) => nameToUnicode(d[0].term))

    
    fullBinSvgs.each(function() {
        const fullBinSvg = d3.select(this)

        updateFullColorBinSvg(fullBinSvg)
    })
}


function updateFullColorBinSvg(fullBinSvg){

    const langAbv = fullBinSvg.attr("data-lang")
    const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))
    //const width = fullBinSvg.attr("width")
    //const height = fullBinSvg.attr("height")

    // if svg not on screen, leave empty
    if(!isVisibleInViewport(fullBinSvg.node())){
        fullBinSvg.html("")
        return
    }

    // if the svg is already filled in, we don't need to 
    // re-draw it:
    // TODO: track last-drawn info in svg and see if it has changed???
    // if(fullBinSvg.node().children.length > 0){
    //     return
    // }

    const fullData = getFullBinInfo(langAbv, term)

    
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



    fullBinSvg
        .attr("width", width)
        .attr("height", height)


    binView.createOrUpdateColorTiles(fullBinSvg, {
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

    return fullBinSvg
}



// TODO: OLD: delete 
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



    const fullBinSvg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
        .attr("width", width)
        .attr("height", height)
        .attr("content-visibility", "auto")
        .attr("xmlns", "http://www.w3.org/2000/svg")


    binView.createOrUpdateColorTiles(fullBinSvg, {
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

    return fullBinSvg
}




