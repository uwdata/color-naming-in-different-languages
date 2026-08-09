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


// from FreeCodeCamp https://www.freecodecamp.org/news/javascript-debounce-example/
function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

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

// get selected lang from url if there, otherwise default to Korean
const initialUrlParams = new URLSearchParams("?" + window.location.hash.replace("#", ""));
const prev_selected_lang_abv = initialUrlParams.get("lang_abv") ? initialUrlParams.get("lang_abv") : "ko"

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
    const lang = langAbvToLang[langAbv]
    const term = nameFromUnicode(event.relatedTarget.getAttribute("data-color-name"))

    const nameInfoByLang = Object.groupBy(allColorInfo, ({lang}) => lang)
    currentColorTermData =  lang in nameInfoByLang ? nameInfoByLang[lang].find(d => d.simplifiedName == term) : undefined

    $("#color_details_modal_name").text(currentColorTermData.commonName)
    $("#color_details_modal_lang").text(langAbv + " - " + currentColorTermData.lang)
    $("#color_details_modal_simplified_name").text(term)
    if(currentColorTermData.fullColorInfo){
        $("#color_details_modal_full_details").show()
        $("#color_details_modal_full_perc").text(currentColorTermData.fullColorInfo.tinyResBlurTermFraction * 100)
        $("#color_details_modal_full_num_entries").text(currentColorTermData.numFullNames)
    } else {
        $("#color_details_modal_full_details").hide()
    }
    if(currentColorTermData.hueColorInfo){
        $("#color_details_modal_hue_details").show()
        $("#color_details_modal_hue_perc").text(currentColorTermData.hueColorInfo.lowResBlurTermFraction * 100)
        $("#color_details_modal_hue_num_entries").text(currentColorTermData.numLineNames)
    } else {
        $("#color_details_modal_hue_details").hide()
    }

    // Average Color Info
    // TODO: Show basic color info has an average, and full color info has a weighted average
    if(currentColorTermData.fullColorInfo){
        $("#color_details_modal_avg_full_color").show()
        $("#color_details_modal_avg_full_color_patch").css("background-color", currentColorTermData.avgFullColorRGBCode)
        $("#color_details_modal_avg_full_color_rgb").text(currentColorTermData.avgFullColorRGBCode)
        $("#color_details_modal_avg_full_color_oklab").text(new Color({space: "oklab", coords: [currentColorTermData.fullColorInfo.tinyResBlurAvgL, currentColorTermData.fullColorInfo.tinyResBlurAvgA, currentColorTermData.fullColorInfo.tinyResBlurAvgB]}))
        $("#color_details_modal_avg_full_color_oklch").text(new Color({space: "oklab", coords: [currentColorTermData.fullColorInfo.tinyResBlurAvgL, currentColorTermData.fullColorInfo.tinyResBlurAvgA, currentColorTermData.fullColorInfo.tinyResBlurAvgB]}).to("oklch"))
    } else{
        $("#color_details_modal_avg_full_color").hide()
    }

    // TODO: Show basic color info has an average, and full color info has a weighted average??
    if(currentColorTermData.hueColorInfo){
        $("#color_details_modal_avg_hue_color").show()
        $("#color_details_modal_avg_hue_color_patch").css("background-color", currentColorTermData.avgHueRGBCode)
        $("#color_details_modal_avg_hue_color_rgb").text(currentColorTermData.avgHueRGBCode)
        $("#color_details_modal_avg_hue_color_oklab").text(new Color(currentColorTermData.avgHueRGBCode).to("oklab"))
        $("#color_details_modal_avg_hue_color_oklch").text(new Color(currentColorTermData.avgHueRGBCode).to("oklch"))
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
        
        const fullBinSvgSelect = d3.select("#color_details_modal_full_bins_view")
            .data([{row: currentColorTermData}])
        d3SvgUpdateFullColorBins(fullBinSvgSelect, true)
    }else{
        $("#color_details_modal_full_bins").hide()
    }

    // hue bins
    const hueData = getHueBinInfo(langAbv, term)
    if(hueData){
        $("#color_details_modal_hue_bins").show()
        const hueLineSvgSelect = d3.select("#color_details_modal_hue_bins_line_view")
            .data([{row: currentColorTermData}])
        d3SvgUpdateHueColor(hueLineSvgSelect, true, "line")

        const hueRingSvgSelect = d3.select("#color_details_modal_hue_bins_circle_view")
            .data([{row: currentColorTermData}])
        d3SvgUpdateHueColor(hueRingSvgSelect, true, "ring")
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
    link.setAttribute("download", `full_color_bins_summaries_${currentColorTermData.lang_abv}_${currentColorTermData.simplifiedName}.csv`);
    document.body.appendChild(link); // Required for FF

    link.click();
})

$("#download_language_subset_button").click(e => {
    //const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentDataset)
    const jsonContent = "data:text/json;charset=utf-8," + JSON.stringify(sortedColorInfo, null, 2)
    
    const currentDatasetLangAbv = $("#selected_langs").val()
    // TODO: update based on dropdown
    const currentDatasetRgbSet = "all"

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


//tmp solution
let rgbSet = "both-hue-full"


// default to URL param value

if(initialUrlParams.get("hideNonPinned")){
    $("#hide-non-pinned-control").show()
    $("#hide-non-pinned").prop("checked", true)

} else {
    $("#hide-non-pinned-control").hide()
    $("#hide-non-pinned").prop("checked", false)
}

const defaultBackgroundBrightness = 95
let backgroundBrightness = initialUrlParams.get("backgroundBrightness") ? parseInt(initialUrlParams.get("backgroundBrightness")) : defaultBackgroundBrightness
$("#background-brightness").val(backgroundBrightness)

const defaultSortColumnId = "fullNamePercent"
const defaultSortDirection = "down"
const defaultSecondarySortColumnId = "hueNamePercent"
const defaultSecondarySortDirection = "down"
let sortColumnId = initialUrlParams.get("sortColumnId") ? initialUrlParams.get("sortColumnId") : defaultSortColumnId
let sortDirection = initialUrlParams.get("sortDirection") ? initialUrlParams.get("sortDirection") : defaultSortDirection
let secondarySortColumnId = initialUrlParams.get("secondarySortColumnId") ? initialUrlParams.get("secondarySortColumnId") : defaultSecondarySortColumnId
let secondarySortDirection = initialUrlParams.get("secondarySortDirection") ? initialUrlParams.get("secondarySortDirection") : defaultSecondarySortDirection
let multipleLangsDisplayed = false
let pinnedColorTerms = []
if(initialUrlParams.get("pinnedColorTerms")){
    try{
        const urlPinnedColorTerms = JSON.parse(initialUrlParams.get("pinnedColorTerms"))
        for(const urlPinnedColorTerm of urlPinnedColorTerms){
            const colorInfo = allColorInfo.find(c => 
                c.simplifiedName === urlPinnedColorTerm.simplifiedName && 
                c.lang_abv === urlPinnedColorTerm.lang_abv
            )
            if(colorInfo){
                pinnedColorTerms.push(colorInfo)
            } else{
                console.error("could not find color to pin: ", colorInfo)
            }
        }
        if(pinnedColorTerms.length > 0){
            $("#hide-non-pinned-control").show()
        }
    } catch (e) {
        console.error("Error parsing URL params:", e)
    }
}


// Now that all the url params have been used to start the view, clear them:
window.location.hash = ""


let search_string
let search_lang_abv

function getUrlWithParams(){
    const urlParams = new URLSearchParams("?" + window.location.hash.replace("#", ""));
	urlParams.set("lang_abv", $("#selected_langs").val())

    if(sortColumnId != defaultSortColumnId || sortDirection != defaultSortDirection){
        urlParams.set("sortColumnId", sortColumnId);
        urlParams.set("sortDirection", sortDirection)
    } else {
        urlParams.delete("sortColumnId");
        urlParams.delete("sortDirection");
    }

    if(pinnedColorTerms.length > 0){
        urlParams.set("pinnedColorTerms", 
            JSON.stringify(
                pinnedColorTerms.map(pc => { return {simplifiedName: pc.simplifiedName, lang_abv: pc.lang_abv}})
            )
        );
    } else {
        urlParams.delete("pinnedColorTerms")
    }

    if(secondarySortColumnId && (defaultSecondarySortColumnId != secondarySortColumnId || defaultSecondarySortDirection != secondarySortDirection)){
        urlParams.set("secondarySortColumnId", secondarySortColumnId);
        urlParams.set("secondarySortDirection", secondarySortDirection);
    }else{
        urlParams.delete("secondarySortColumnId");
        urlParams.delete("secondarySortDirection");
    }
    if($("#hide-non-pinned").is(':checked')){
         urlParams.set("hideNonPinned", true)
    } else {
        urlParams.delete("hideNonPinned");
    }

    if(backgroundBrightness !== defaultBackgroundBrightness){
        urlParams.set("backgroundBrightness", backgroundBrightness)
    }else{
        urlParams.delete("backgroundBrightness");
    }
    const url = new URL(window.location.href) 
	url.hash = urlParams.toString().replace("?", "");
    return url
}

function fullNamePercentCompare(a, b){
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
            return parseFloat(b.numFullNames) - parseFloat(a.numFullNames)
        }
    }
}

function hueNamePercentCompare(a, b){
    const aTotalColorFraction = a.hueColorInfo ? a.hueColorInfo.lowResBlurTermFraction : undefined
    const bTotalColorFraction = b.hueColorInfo ? b.hueColorInfo.lowResBlurTermFraction : undefined
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
            return parseFloat(b.numLineNames) - parseFloat(a.numLineNames)
        }
    }
}

function pinToggleColorTerm(event){
    const langAbv = event.target.getAttribute("data-lang") 
    const lang = langAbvToLang[langAbv]
    const term = nameFromUnicode(event.target.getAttribute("data-color-name"))

    const nameInfoByLang = Object.groupBy(allColorInfo, ({lang}) => lang)
    const colorTermData =  lang in nameInfoByLang ? nameInfoByLang[lang].find(d => d.simplifiedName == term) : undefined

    if(pinnedColorTerms.includes(colorTermData)){
        pinnedColorTerms = pinnedColorTerms.filter(t => t !== colorTermData)
    }else{
        pinnedColorTerms.push(colorTermData)
    }

    if(pinnedColorTerms.length > 0){
        $("#hide-non-pinned-control").show()
    }else {
        $("#hide-non-pinned-control").hide()
        $("#hide-non-pinned").prop("checked", false)
    }

    updateData()
}
window.pinToggleColorTerm = pinToggleColorTerm // make function global for onclick

const allTableCols = [
    {
        id: "commonName",
        key: "commonName",
        sortable: true,
        defaultSortDirection: "up",
        headerHTML: `<p style="margin-bottom:0px">Name</p>
                    <p style="margin-bottom:0px" class="table-subheader">simplified name</p>`,
        formatter: (cell, row) => 
            `<div style="display:inline-flex">
                <div style="cursor:pointer" data-bs-toggle="modal" data-bs-target="#color_details_modal" data-lang="${escapeHTML(row.lang_abv)}" data-color-name="${nameToUnicode(row.simplifiedName)}">
                    <p style="margin-bottom:0px" translate="no" class="notranslate">${escapeHTML(row.commonName)}
                    <p style="margin-bottom:0px" class="table-subheader notranslate" translate="no">${escapeHTML(row.simplifiedName)}</p>
                </div>

                
                <i class="color-name-pin bi ${pinnedColorTerms.includes(row) ? "bi-pin-fill" : "bi-pin-angle"}" 
                    ${pinnedColorTerms.includes(row) ? "" : `style="font-size: smaller"`}
                    data-lang="${escapeHTML(row.lang_abv)}" data-color-name="${nameToUnicode(row.simplifiedName)}"
                    onclick="pinToggleColorTerm(event)"
                    ></i>
            </div>`
    },
    {
        id: "lang",
        key: "lang",
        sortable: true,
        hideForOneLanguage: true,
        defaultSortDirection: "up",
        headerHTML: `Lang`,
        formatter: (cell, row) => 
            `<div style="cursor:pointer" data-bs-toggle="modal" data-bs-target="#color_details_modal" data-lang="${row.lang_abv}" data-color-name="${nameToUnicode(row.simplifiedName)}">
                <p style="margin-bottom:0px" translate="no" class="notranslate">${escapeHTML(row.lang_abv)}</p>
                <p style="margin-bottom:0px" translate="no" class="table-extra-small-subheader notranslate">${escapeHTML(row.lang)}
            </div>`
            //
    },
    {
        id: "avgColor",
        key: "avgFullColorRGBCode",
        sortable: true,
        defaultSortDirection: "down",
        headerHTML: `
            <p style="margin-bottom:0px">Avg Color</p>
            <p class="table-subheader" style="margin-bottom:0px">${rgbSet == "both-hue-full" ? "full / hue" : rgbSet == "full-data" ? "full" : "hue"}</p>`,
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
                <div style="white-space:nowrap;cursor:pointer;" data-bs-toggle="modal" data-bs-target="#color_details_modal" data-lang="${escapeHTML(row.lang_abv)}" data-color-name="${nameToUnicode(row.simplifiedName)}">
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
        id: "somColorPatch",
        key: "somColorPatch",
        headerHTML: "Sample",
        sortable: false,
        formatter: (cell, row) => {
            if(!cell){
                return `<div style="width:${cellHeight}px; height:${cellHeight}px; margin: auto;">
                ${!colorSampleSOMs ? 
                    '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>' 
                    : ""
                }
                </div>`;
            }
            return 'colorNodes16' in cell ? generateColorGrid(cell.colorNodes16) :
                   'colorNodes9' in cell ?  generateColorGrid(cell.colorNodes9) :
                   generateColorGrid(cell.colorNodes4)
        }
    },
    {
        id: "fullBins",
        key: "fullBinsData",
        headerHTML: "Full Bins",
        width: "262px",
        sortable: false,
        d3Formatter: d3SvgUpdateFullColorBins
            
    },
    {
        key: "hueBins",
        headerHTML: "Hue Bins",
        sortable: false,
        d3Formatter: d3SvgUpdateHueColor
    },
    {
        id: "fullNamePercent",
        headerHTML: `<p style="margin-bottom:0px">% full names</p>
                    <p style="margin-bottom:0px" class="table-subheader">num entries</p>`,
        sortable: true,
        defaultSortDirection: "down",
        compare: fullNamePercentCompare,
        formatter: (cell, row, col) => {
            const totalColorFraction = row.fullColorInfo ? row.fullColorInfo.tinyResBlurTermFraction : undefined
            return `<p style="margin-bottom:0px">${totalColorFraction ? (totalColorFraction * 100).toPrecision(3) / 1 + "%" : ""}</p>
            <p style="margin-bottom:0px" class="table-subheader">${row.numFullNames} entries</p>`
        }
    },
    {
        id: "hueNamePercent",
        headerHTML: `<p style="margin-bottom:0px">% hue names</p>
                    <p style="margin-bottom:0px" class="table-subheader">num entries</p>`,
        sortable: true,
        defaultSortDirection: "down",
        compare: hueNamePercentCompare,
        formatter: (cell, row, col) => {
            const totalColorFraction = row.hueColorInfo ? row.hueColorInfo.lowResBlurTermFraction : undefined
            return `<p style="margin-bottom:0px">${totalColorFraction ? (totalColorFraction * 100).toPrecision(3) / 1 + "%" : ""}</p>
            <p style="margin-bottom:0px" class="table-subheader">${row.numLineNames} entries</p>`
        }
    }
]
let tableCols = allTableCols

function normalizeStringForSearch(str){
    return str
        .normalize("NFD")
	    .replace(/\p{Diacritic}/gu, "")
		.replace(/\s*$/,"") // trim white space
        .replace(/^\s*/,"")
        .replace(/[-_]+/g," ")
        .replace(/\s+/g,"")
}

function searchMatch(term, searchString){
    if(search_lang_abv == "allLang" && term.normalizeStringForSearch(lang).includes(searchString)){
        return true
    }

    const normalized_simplified_term = normalizeStringForSearch(term.simplifiedName)
    const normalized_common_name = normalizeStringForSearch(term.commonName)
    if(normalized_simplified_term.includes(searchString) || normalized_common_name.includes(searchString)){
        return true
    }

    return false
}


const updateFilteredData = 
    debounce(() => { // debounce updateFilteredData to keep it from updating too fast on searches and loading

        const new_lang_abv = $("#selected_langs").val()
        if(new_lang_abv == "allLang"){
            multipleLangsDisplayed = true
        } else {
            multipleLangsDisplayed = false
        }

        const hideNonPinned = $("#hide-non-pinned").is(':checked')
        if(hideNonPinned){
            filteredColorInfo = []
        } else {
            // filter by language
            if(new_lang_abv == "allLang"){
                filteredColorInfo = allColorInfo
            } else{
                filteredColorInfo = allColorInfo.filter((t) => t.lang_abv == new_lang_abv)
            }
            
            
            // filter by search term
            const new_search_str =normalizeStringForSearch( $("#search-input").val())

            if(new_search_str != search_string || new_lang_abv != search_lang_abv){

                search_string = new_search_str
                search_lang_abv = new_lang_abv

                // if only an empty search, match all
                if(!search_string || search_string.length == 0){
                    filteredColorInfo = filteredColorInfo
                } else {
                    filteredColorInfo = filteredColorInfo.filter((t) =>  searchMatch(t, search_string))
                }
            } else {
                console.log("skipping search")
            }
        }

        // make sure all pinned colors are present
        for(const pinnedColor of pinnedColorTerms){
            if(!filteredColorInfo.includes(pinnedColor)){
                filteredColorInfo.push(pinnedColor)
                if(pinnedColor.lang_abv !== new_lang_abv){
                    multipleLangsDisplayed = true
                }
            }
        }

        sortFilteredData()
    }
)

function sortFilteredData(){
    if(!filteredColorInfo){
        return
    }
    const sortColumn = tableCols.find((c) => c.id == sortColumnId)
    const secondarySortColumn = secondarySortColumnId ? tableCols.find((c) => c.id == secondarySortColumnId) : undefined
    const sortDirectionSign = sortDirection == "up" ? -1 : 1
    const secondarySortDirectionSign = secondarySortDirection == "up" ? -1 : 1
    

    //TODO: make pinned be first compare 
    sortedColorInfo = filteredColorInfo.sort((a, b) => {
        // pinned always stay at top
        if(pinnedColorTerms.includes(a) && !pinnedColorTerms.includes(b)){
            return -1
        } else if (pinnedColorTerms.includes(b) && !pinnedColorTerms.includes(a)) {
            return 1
        }
        // sort 1
        const sort1Compare = sortColumn.compare ? sortColumn.compare(a, b) * sortDirectionSign : 
            a[sortColumn.key] < b[sortColumn.key] ? sortDirectionSign :
            a[sortColumn.key] > b[sortColumn.key] ? - sortDirectionSign:
            0

        if(sort1Compare !== 0){
            return sort1Compare
        }

        // sort 2
        if(secondarySortColumn){
            return secondarySortColumn.compare ? secondarySortColumn.compare(a, b) * secondarySortDirectionSign : 
            a[secondarySortColumn.key] < b[secondarySortColumn.key] ? secondarySortDirectionSign :
            a[secondarySortColumn.key] > b[secondarySortColumn.key] ? - secondarySortDirectionSign:
            0
        } else {
            return 0
        }
    })
    updateTable()
}

// TODO: Perhaps put table rows into groups of 20 or something, and only display when on screen
//     (to make table drawing more efficient)

// Also: todo: set table background once, rather than per-cell (header background once as well?)
function updateTable(){

    if(!sortedColorInfo){
        return
    }

    if(multipleLangsDisplayed){
        tableCols = allTableCols
    } else {
        tableCols = allTableCols.filter(c => !c.hideForOneLanguage)
    }
    
    const headerRow = d3.select("#data-table").selectAll("thead tr")
    headerRow.selectAll(".table-headers")
        .data(tableCols)
        .join("th")
        .attr("class", "table-headers")
        .style("cursor", d => d.sortable ? "pointer" : "auto" )
        .html(d => 
            `<div style="display:inline-flex">
                <div>
                    ${d.headerHTML}
                </div>
                ${
                    d.sortable ? 
                        sortColumnId == d.id ? 
                            sortDirection == "up" ?
                                `<i class="bi bi-sort-up fs-5 ms-1"></i>`:
                                `<i class="bi bi-sort-down fs-5 ms-1"></i>` :
                        secondarySortColumnId == d.id ? 
                            secondarySortDirection == "up" ?
                                `<i class="bi bi-sort-up text-body-secondary ms-1"></i>`:
                                `<i class="bi bi-sort-down text-body-secondary ms-1"></i>` :
                            `<i class="bi bi-arrow-down-up text-body-tertiary ms-1" style="font-size: smaller"></i>`:
                    ""
                }
                
            </div>
            `)
        .on("click", (e,d,i) => {
            if(d.sortable){
                if(sortColumnId == d.id){
                    sortDirection = sortDirection == "up" ? "down" : "up"
                } else {
                    if(e.shiftKey || e.ctrlKey){ // shift or control for secondary sort
                        secondarySortColumnId = sortColumnId
                        secondarySortDirection = sortDirection
                    } else {
                        secondarySortColumnId = undefined
                        secondarySortDirection = undefined
                    }
                    sortColumnId = d.id
                    sortDirection = d.defaultSortDirection == "up" ? "up" : "down"
                }

                sortFilteredData()
            }
        })


    const tableBody = d3.select("#data-table").selectAll("tbody")
    const nameRows = tableBody.selectAll(".name-row")
        .data(sortedColorInfo)
        .join("tr")
        .attr("class", "name-row")

    const tableCell = nameRows.selectAll(".name-cell")
            .data(d => tableCols.map(col => {
                    return {cell: d[col.key], row: d, tableCol: col}
                }))
            .join("td")
            .attr("class", "name-cell align-middle")
            .style("background-color", `oklab(${escapeHTML(backgroundBrightness)}% 0 0)`)
    
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


    // display the show-non-pinned-colors button if that is relevant
    if(pinnedColorTerms.length > 0 && $("#hide-non-pinned").is(':checked')){
        // move button to last place
        $("#show-non-bin-table-td").attr("colspan", tableCols.length)
        $('#show-non-bin-table-button').show()
    } else {
        $('#show-non-bin-table-button').hide()
    }
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

    // Look up svg visibility separately (to avoid layout thrashing)
    const hueBinVisibility = {}

    for(const hueColorSVG of $(`.hue-color-svg${isModal}`)){
        const hueBinSvg = d3.select(hueColorSVG)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))

        hueBinVisibility[langAbv + ";" + term] = isVisibleInViewport(hueBinSvg.node())
    }

    for(const hueColorSVG of $(`.hue-color-svg${isModal}`)){
        const hueBinSvg = d3.select(hueColorSVG)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))

        if($("#hue_bins_in_circle").is(':checked')){
            updateHueColorRingSvg(hueBinSvg, hueBinVisibility[langAbv + ";" + term])
        } else {
            updateHueColorSvg(hueBinSvg, hueBinVisibility[langAbv + ";" + term])
        }
        
    }
}

function refreshFullSvgs(){
    const isModal = ""

    // Look up svg visibility separately (to avoid layout thrashing)
    const fullBinVisibility = {}
    for(const fullColorSVG of $(`.full-color-svg${isModal}`)){
        const fullBinSvg = d3.select(fullColorSVG)
        const langAbv = fullBinSvg.attr("data-lang")
        const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))

        fullBinVisibility[langAbv + ";" + term] = isVisibleInViewport(fullBinSvg.node())
    }
    
    for(const fullColorSVG of $(`.full-color-svg${isModal}`)){
         const fullBinSvg = d3.select(fullColorSVG)

        const langAbv = fullBinSvg.attr("data-lang")
        const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))

        updateFullColorBinSvg(fullBinSvg, fullBinVisibility[langAbv + ";" + term])
    }
}

$("#data-view").on("scroll", refreshAllSvgs)
$( window ).on( "resize", refreshAllSvgs)

function d3SvgUpdateHueColor(d3selection, isModal, lineOrRing) {
    const isLine = lineOrRing ? lineOrRing == "line" : !$("#hue_bins_in_circle").is(':checked')
    if(isLine){
        d3SvgUpdateHueColorLine(d3selection, isModal)
    } else{
        d3SvgUpdateHueColorRing(d3selection, isModal)
    }
}


function updateHueColorSvg(svg, isVisible){
    const langAbv = svg.attr("data-lang")
    const term = nameFromUnicode(svg.attr("data-color-name"))
    const width = svg.attr("width")
    const height = svg.attr("height")

    // if no langAbv or term data, 
    if(langAbv == "" || term == ""){
        if(!hueBins36 || !colorSampleHueBins36BlurByLang){ // if lowest res hue bins not loaded, show loading spin
            svg.html('<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>')
        } else {
            svg.html("")
        }
        return
    }

    // if svg not on screen, leave empty
    if(!isVisible){
        svg.html("")
        return
    }

    // clear any hue ring elements
    svg.selectAll(".color_scale_patch,circle,.color_patch").remove()

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
            
    } else {
        svg.selectAll(".color_scale_patch_g").remove()
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


function d3SvgUpdateHueColorLine(d3selection, isModal) {
    isModal = isModal ? "-modal" : ""

    const width = 200,
        height = cellHeight

    let anyData = false

    // remove old/irrelevant elements
    d3selection.selectChildren()
        .filter(`:not(.hue-color-svg${isModal}`).remove()
    
    const hueBinSvgs = d3selection.selectAll(`svg.hue-color-svg${isModal}`)
        .data((d) => {
            if(d.row.hueBins36BlurData){
                anyData = true
                combineHueBinDataWithColors(d.row.hueBins36BlurData)
            }
            if(d.row.hueBins72BlurData){
                anyData = true
                combineHueBinDataWithColors(d.row.hueBins72BlurData)
                return [d.row.hueBins72BlurData]
            }
            if(d.row.hueBins36BlurData){
                anyData = true
                return [d.row.hueBins36BlurData]
            }
            return [{}]
        })
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `hue-color-svg${isModal}`)
        .style("cursor", isModal ? "default" : "grab")
        .attr("data-lang", (d) => d.langAbv ? d.langAbv : "") 
        .attr("data-color-name", (d) => d.simplifiedName ? nameToUnicode(d.simplifiedName) : "")

    if(!anyData && (!hueBins36 || !colorSampleHueBins36BlurByLang)){ // if lowest res hue bins not loaded, show loading spin
        d3selection.html(`<div class="hue-color-spinner" style="width:${width}px;height:${height}px" ><div class="spinner-border" role="status" ><span class="visually-hidden">Loading...</span></div></div>`)
        return
    } else {
        d3selection.selectAll(".hue-color-spinner").remove()
    }
    
    // Look up svg visibility separately (to avoid layout thrashing)}
    const hueBinVisibility = {}
    hueBinSvgs.each(function () {
        const hueBinSvg = d3.select(this)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))
  
        hueBinVisibility[langAbv + ";" + term] = isVisibleInViewport(hueBinSvg.node())
    })

    hueBinSvgs.each(function() {
        const hueBinSvg = d3.select(this)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))

        updateHueColorSvg(hueBinSvg, hueBinVisibility[langAbv + ";" + term])

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

function updateHueColorRingSvg(svg, isVisible){
    const langAbv = svg.attr("data-lang")
    const term = nameFromUnicode(svg.attr("data-color-name"))
    const width = svg.attr("width")
    const height = svg.attr("height")

    // if no langAbv or term data, 
    if(langAbv == "" || term == ""){
        if(!hueBins36 || !colorSampleHueBins36BlurByLang){ // if lowest res hue bins not loaded, show loading spin
            svg.html('<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>')
        } else {
            svg.html("")
        }
        return
    }

    // if svg not on screen, leave empty
    if(!isVisible){
        svg.html("")
        return
    }

    // clear any hue line elements
    svg.selectAll(".color_scale_patch_g,.color_patch_g,.color_patch_main_fade_left,.color_patch_main_left,.color_patch_main_right,.color_patch_main_fade_right,.hue-line-begin-range,.hue-line-end-range").remove()

    const hueData = getHueBinInfo(langAbv, term)

    
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
        svg.selectAll(".color_scale_patch")
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
        
        // clear circle from no scale
        svg.selectAll("circle").remove()

    } else {
        // clear any old circle
        svg.selectAll("circle").remove()

        svg.append("circle")
            .attr("cx", width/2)
            .attr("cy", height/2)
            .attr("r", centerRadius)
            .attr("fill", "rgba(128,128,128,0.1)")
        
        // clear scale
        svg.selectAll(".color_scale_patch").remove()
    }

    

    svg.selectAll(".color_patch")
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


}



function d3SvgUpdateHueColorRing(d3selection, isModal) {
    isModal = isModal ? "-modal" : ""

     const width = cellHeight,
        height = cellHeight


    let anyData = false

    //remove old/irrelevant elements
    d3selection.selectChildren()
        .filter(`:not(.hue-color-svg${isModal}`).remove() 
    
    const hueBinSvgs = d3selection.selectAll(`svg.hue-color-svg${isModal}`)
        .data((d) => {
            if(d.row.hueBins36BlurData){
                anyData = true
                combineHueBinDataWithColors(d.row.hueBins36BlurData)
            }
            if(d.row.hueBins72BlurData){
                anyData = true
                combineHueBinDataWithColors(d.row.hueBins72BlurData)
                return [d.row.hueBins72BlurData]
            }
            if(d.row.hueBins36BlurData){
                anyData = true
                return [d.row.hueBins36BlurData]
            }
            return [{}]
        })
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `hue-color-svg${isModal}`)
        .style("cursor", isModal ? "default" : "grab")
        .attr("data-lang", (d) => d.langAbv ? d.langAbv : "") 
        .attr("data-color-name", (d) => d.simplifiedName ? nameToUnicode(d.simplifiedName) : "")

    if(!anyData && (!hueBins36 || !colorSampleHueBins36BlurByLang)){ // if lowest res hue bins not loaded, show loading spin
        d3selection.html(`<div class="hue-color-spinner" style="width:${width}px;height:${height}px" ><div class="spinner-border" role="status" ><span class="visually-hidden">Loading...</span></div></div>`)
        return
    } else {
        d3selection.selectAll(".hue-color-spinner").remove()
    }

    // Look up svg visibility separately (to avoid layout thrashing)}
    const hueBinVisibility = {}
    hueBinSvgs.each(function () {
        const hueBinSvg = d3.select(this)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))
  
        hueBinVisibility[langAbv + ";" + term] = isVisibleInViewport(hueBinSvg.node())
    })

    
    hueBinSvgs.each(function() {
        const hueBinSvg = d3.select(this)
        const langAbv = hueBinSvg.attr("data-lang")
        const term = nameFromUnicode(hueBinSvg.attr("data-color-name"))

        updateHueColorRingSvg(hueBinSvg, hueBinVisibility[langAbv + ";" + term])
    })
}


function combineHueBinDataWithColors (hueData){
    if("colorBin" in hueData.bins[0]){ // if we've already done this, no need to repeat
        return
    }

    for(const[binN, binDataInfo] of hueData.bins.entries()){
        binDataInfo.colorBin = hueData.bins.length == 72 && hueBins72 ?
            hueBins72.find(b => parseInt(b.bin_i) == binN) : 
            hueBins36 ? //assume alternative is 36
                hueBins36.find(b => parseInt(b.bin_i) == binN) :
                undefined
        binDataInfo.binColorStr = `rgb(${binDataInfo.colorBin.bin_center_r},${binDataInfo.colorBin.bin_center_g},${binDataInfo.colorBin.bin_center_b})`
    }
}

function d3SvgUpdateFullColorBins(d3selection, isModal) {
    isModal = isModal ? "-modal" : ""

    const maxWidth = 260,
        maxHeight = cellHeight


    const width = maxWidth
    const height = maxHeight

    
    /////////////////

    let anyData = false

    //remove old/irrelevant elements 
    d3selection.selectChildren()
        .filter(`:not(.full-color-svg${isModal}`).remove()
    
    const fullBinSvgs = d3selection.selectAll(`svg.full-color-svg${isModal}`)
        .data((d) => {
            if(d.row.fullBinsData){
                anyData = true
                return [d.row.fullBinsData]
            }
            return [{}]
        })
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("class", `full-color-svg${isModal}`)
        .attr("data-lang", (d) => d[0] ? d[0].langAbv : "") 
        .attr("data-color-name", (d) => d[0] ? nameToUnicode(d[0].term) : "")

    if(!anyData && (!fullBinsInfo || !colorSampleFullBins)){ // if lowest res hue bins not loaded, show loading spin
        d3selection.html(`<div class="full-color-spinner" style="width:${width}px;height:${height}px" ><div class="spinner-border" role="status" ><span class="visually-hidden">Loading...</span></div></div>`)
        return
    } else {
        d3selection.selectAll(".full-color-spinner").remove()
    }

    // Look up svg visibility separately (to avoid layout thrashing)
    const fullBinVisibility = {}
    fullBinSvgs.each(function (d, i) {
        const fullBinSvg = d3.select(this)
        const langAbv = fullBinSvg.attr("data-lang")
        const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))

        fullBinVisibility[langAbv + ";" + term] = isVisibleInViewport(fullBinSvg.node())
    })
    
    fullBinSvgs.each(function(d, i) {
        const fullBinSvg = d3.select(this)

        const langAbv = fullBinSvg.attr("data-lang")
        const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))


        updateFullColorBinSvg(fullBinSvg, fullBinVisibility[langAbv + ";" + term])
    })
}


function updateFullColorBinSvg(fullBinSvg, isVisible){

    const langAbv = fullBinSvg.attr("data-lang")
    const term = nameFromUnicode(fullBinSvg.attr("data-color-name"))

    // if no data (no langAbv or term), leave empty
    if(langAbv == "" || term == ""){
        fullBinSvg.html("")
        return
    }

    // if svg not on screen, leave empty
    if(!isVisible){
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
        backgroundColor: `oklab(${escapeHTML(backgroundBrightness)}% 0 0)`,
        getTileScale: (b) => {
            // TODO: Reorganize fullData as nested dictionaries to speed up this lookup
            //    currently one of the bottlenecks slowing down the page
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


// intitalize values

// clear search
$("#search-input").val("")


$("#copy-link-button").on('click', () => {
    const url = getUrlWithParams()
    navigator.clipboard.writeText(url.href) 
})

// handle update events

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

$("#hide-non-pinned").change(() => {
    updateFilteredData()
})

$("#show-non-bin-table-button").on("click", () => {
    $("#hide-non-pinned").prop("checked", false)
    updateFilteredData()
})


$("#background-brightness").on("input", () => {
    backgroundBrightness = $("#background-brightness").val()
    updateTable()
})