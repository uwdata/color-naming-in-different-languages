
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
console.log(hueColorNames[0]);

$("#selected_langs").change(e => { 
    updateTableData()
})

$("input:radio[name=color_set]").change(e => { 
    updateColorSet()
})

let currentDataset
let currentDatasetColorSet
let currentDatasetLangAbv
$("#download_language_subset_button").click(e => {
    const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(currentDataset)
    
    // based on:
    // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentDatasetColorSet}_summaries_${currentDatasetLangAbv}.csv`);
    document.body.appendChild(link); // Required for FF

    link.click();
})

let allNamesByLang


updateColorSet()

function updateColorSet(){
    const color_set_val = $('#full_colors').prop("checked") ? "full_colors" : "hue_colors"
    let color_set = fullColorNames
    currentDatasetColorSet = "full_color"
    $("#source-data-link").attr("href", "https://github.com/uwdata/color-naming-in-different-languages/blob/master/model/full_colors_info.csv")
    if(color_set_val == "hue_colors"){
        color_set = hueColorNames
        currentDatasetColorSet = "hue_color"
        $("#source-data-link").attr("href", "https://github.com/uwdata/color-naming-in-different-languages/blob/master/model/hue_colors_info.csv")
    }

    allNamesByLang = Object.groupBy(color_set, ({lang}) => lang)

    console.log(Object.keys(allNamesByLang))

    $("#selected_langs").empty()
    let selected_lang_temp = true
    for(const lang of Object.keys(allNamesByLang)){
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

    currentDatasetLangAbv = allNamesByLang[selected_lang][0].lang_abv

    let nameData = allNamesByLang[selected_lang]

    currentDataset = nameData

    if(!grid){
        $("#loading-data-span").hide()
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
                    name: "Color",
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
                        const avgColor = "avgColorRGBCode" in cell ? cell.avgColorRGBCode : cell.avgHueColor
                        return gridjs.html(`
                        <div
                            style="height:20px; width: 20px; float:left; margin: 5px;
                            background-color:${avgColor};" ></div>
                        ${escapeHTML(avgColor)}`)
                    }
                },
                "Sample",
                "Full Bins",
                "Hue Bins",
                "Name proportion / Commonality [phrasing]??"
                ],
            sort: true,
            search: true,
            pagination: true,
            data: nameData
        }).render(document.getElementById("data_table"));
    } else {
        grid.updateConfig({
            data: nameData
        }).forceRender();
    }
    
}






