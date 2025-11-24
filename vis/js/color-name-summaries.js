// TODO: add download data links to page
// https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side

const escapeHTML = str => String(str).replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
  }[tag]));

$(document).on('ready page:load', async () => {

const hueColorNames = await d3.csv("../model/hue_colors_info.csv");
const fullColorNames = await d3.csv("../model/full_colors_info.csv");
console.log(hueColorNames[0]);

$("#selected_langs").change(e => { 
    updateTableData()
})

$("input:radio[name=color_set]").change(e => { 
    updateColorSet()
})

$("#sort_by").change(e => { 
    updateTableData()
})

let allNamesByLang
const table =  d3.select("#data_view")
    .html("")
    .append("table")

table.append("thead")
table.append("tbody")


updateColorSet()

function updateColorSet(){
    const color_set_val = $('#full_colors').prop("checked") ? "full_colors" : "hue_colors"
    let color_set = fullColorNames
    if(color_set_val == "hue_colors"){
        color_set = hueColorNames
    }

    allNamesByLang = Object.groupBy(color_set, ({lang}) => lang)

    console.log(Object.keys(allNamesByLang))

    $("#selected_langs").empty()
    let selected_lang_temp = true
    for(lang of Object.keys(allNamesByLang)){
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
    

    table.select("thead").selectAll("th")
        .data(Object.keys(allNamesByLang[selected_lang][0]))
        .join("th")
        .text(d => d)

    let nameData = allNamesByLang[selected_lang]

    const sort_by = $("#sort_by").val()
    if(sort_by == "count"){
        if("totalColorFraction" in nameData[0]){
            nameData = nameData.sort((a, b) => b.totalColorFraction - a.totalColorFraction)
        } else {
            nameData = nameData.sort((a, b) => b.cnt - a.cnt)
        }
        
    } else if(sort_by == "name"){
        nameData = nameData.sort((a, b) => a.commonName.localeCompare(b.commonName))
    } else if(sort_by == "hue"){
        nameData = nameData.sort((a, b) => {
            let a_h, b_h
            if("avgL" in a){
                a_h = new Color({space: "oklab", coords: [a.avgL, a.avgA, a.avgB]}).to("oklch").h
                b_h = new Color({space: "oklab", coords: [b.avgL, b.avgA, b.avgB]}).to("oklch").h
            } else {
                a_h = new Color(a.avgHueColor).to("oklch").h
                b_h = new Color(b.avgHueColor).to("oklch").h
            }
            return a_h - b_h
        })
    }
        //.sort((a, b) => a.simplifiedName.localeCompare(b.simplifiedName))

    const rows = table
        .select("tbody")
        .selectAll("tr")
        .data(Object.entries(nameData))
        .join("tr")
    
    rows.selectAll("td")
        .data(d => Object.entries(d[1]))
        .join("td")
        .html(d => {
            if(d[0] == "avgHueColor" || d[0] == "avgColorRGBCode"){
                return `
                <div
                    style="height:20px; width: 20px; float:left; margin: 5px;
                    background-color:${d[1]};" ></div>
                ${escapeHTML(d[1])}`
            }
            return escapeHTML(d[1])
        })


    
}

})





