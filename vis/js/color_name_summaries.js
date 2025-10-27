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
console.log(hueColorNames[0]);

const allNamesByLang = Object.groupBy(hueColorNames, ({lang}) => lang)

console.log(Object.keys(allNamesByLang))

let selected_lang_temp = true
for(lang of Object.keys(allNamesByLang)){
    $("#selected_langs").append(new Option(lang, lang, true, selected_lang_temp))
    selected_lang_temp = false
}

$("#selected_langs").change(e => { 
    updateTableData()
})

const table = d3.select("#data_view")
    .html("")
    .append("table")



updateTableData();

function updateTableData(){
    const selected_lang = $("#selected_langs").val()
    if(!selected_lang){
        return
    }
    table.selectAll("th")
        .data(Object.keys(allNamesByLang[selected_lang][0]))
        .join("th")
        .text(d => d)

    const nameData = allNamesByLang[selected_lang]
    const rows = table
        .selectAll("tr")
        .data(Object.entries(nameData))
        .join("tr")
            .attr("test", d => {
                d.test
            })
    
    rows.selectAll("td")
        .data(d => Object.entries(d[1]))
        .join("td")
        .html(d => {
            console.log("html", d[0])
            if(d[0] == "avgHueColor"){
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





