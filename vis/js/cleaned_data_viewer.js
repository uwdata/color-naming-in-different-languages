$(document).on('ready page:load', async () => {

const cleanedColorNames = await d3.csv("../model/cleaned_color_names.csv");
console.log(cleanedColorNames[0]);

const allNamesByLang = Object.groupBy(cleanedColorNames, ({lang0}) => lang0)

console.log(Object.keys(allNamesByLang))

//let selected_lang = "English (English)"
let selected_lang = Object.keys(allNamesByLang).find(a => a.startsWith("Greek"))

$("#selected_langs").empty()

const languagesSorted = Object.keys(allNamesByLang).sort()
for(lang of languagesSorted){
    let selected_lang_temp = lang.startsWith("Greek")
    $("#selected_langs").append(new Option(`${lang} (${allNamesByLang[lang].length.toLocaleString()})`, lang, true, selected_lang_temp))
    selected_lang_temp = false
}

$("#selected_langs").change(e => { 
    updateTableData()
})

$("#min_name_count").change(e => { 
    updateTableData()
})

// nested groups: 
// First: name
// second: 

// group by name?
const groupedNamesByLang = {}
for(let [lang, langData] of Object.entries(allNamesByLang)){
    console.log(lang)
    const groupedTerm = Object.groupBy(
        langData, 
        ({name}) => name)

    groupedNamesByLang[lang] = Object.entries(groupedTerm).map(gTerm => {
        const termGroup = d3.groups(
                gTerm[1], 
                    t => t.standardized_entered_name)
        
        const commonName = termGroup
                .map(a => {
                    return {key: a[0], values: a[1]}})
                .sort((a,b) => -a.values.length + b.values.length)[0]
                .key
        
        const standardized_entered_name_count = termGroup.length

        let color_sample = []
        if(gTerm[1].length < 10){
            color_sample = gTerm[1].map(a => {return {r: a.r, g: a.g, b: a.b}})
        }else{
            // TODO: randomly sample instead of just choosing first 9
            const rand_is = []
            while(rand_is.length < 10){
                const rand_i = Math.floor(Math.random() * gTerm[1].length)
                if(!rand_is.includes(rand_i)){
                    rand_is.push(rand_i)
                }
            }
            color_sample = rand_is.map(i => {return {r: gTerm[1][i].r, g: gTerm[1][i].g, b: gTerm[1][i].b}})
        }
        return {
            "Common Name": commonName,
            "simplified name": gTerm[1][0].name,
            "Color Sample": color_sample,
            "data count": gTerm[1].length,
            "Standardized Names": termGroup,
            //expand: "+"
        }
    })
}



// sort by name
for(let [lang, langData] of Object.entries(groupedNamesByLang)){
    groupedNamesByLang[lang] = langData
        .sort((a, b) => a["Common Name"].localeCompare(b["Common Name"]))
}

$("#data_view").empty()
    

const table = d3.select("#data_view")
    .append("table")

table.selectAll("th")
        .data(Object.keys(groupedNamesByLang[selected_lang][0]))
        .join("th")
        .text(d => d)
        //.style("max-width", (d) => d == "standardized names" ? "120px" : undefined)

updateTableData();

function updateTableData(){
    const selected_lang = $("#selected_langs").val()

    let nameData = groupedNamesByLang[selected_lang]

    // filter by length more than 1
    const min_name_count = $("#min_name_count").val()
    if(min_name_count > 1){
        const preLength = nameData.length
        nameData = nameData.filter(d => d["data count"] > min_name_count)
        $("#filter_lang_note").text(`Filtered down from ${preLength.toLocaleString()}, to ${nameData.length.toLocaleString()} names`)
    }else{
        $("#filter_lang_note").text(`Showing ${nameData.length.toLocaleString()} names`)
    }



    const rows = table
        .selectAll("tr")
        .data(Object.entries(nameData))
        .join("tr")
            .attr("test2", "test2")
            .attr("id", (d) => 
                "name_" + d[0])
    
    const tds = rows.selectAll("td")
        .data(d => Object.entries(d[1]))
        .join("td")
        .attr("class", (d) => d[0] == "expand" ? "expand" : undefined)
        .html(d => {
            if(d[0] == "Standardized Names"){
                return `<ul>
                ${d[1]
                    .map(a => 
                        $("<li></li>").text(a[0]).prop('outerHTML'))
                    .join("")}
                </ul>`
                // table_list.selectAll("li")
                // .data(simplifiedNameEntries)
                // .join("li")
                // .text((d) => `${d[0]} (${d[1].length})`)
            }else if(d[0] == "Color Sample") {
                const size = 10
                return `
                <div class="d-flex flex-row">
                ${d[1].map(
                    c => `<div style="background-color:${d3.rgb(c.r, c.g, c.b)};height:${size}px;width:${size}px"></div>`).join("")
                }
                </div>
                `
            } else {
                return $('<span />').text(d[1]).prop('outerHTML')
            }
        })
        //.on("click", expandCommonName)


    // function expandCommonName(event, d){
    //     console.log(event, d)
    //     if(d[0] == "expand"){
    //         const parent_id = event.currentTarget.parentNode.id
    //         const name_i = parseInt(parent_id.split("name_")[1])
    //         const simplified_name = nameData[name_i]["simplified name"]
    //         console.log(simplified_name)
    //         const simplifiedNameData = Object.groupBy(
    //             allNamesByLang[selected_lang]
    //                 .filter(d => 
    //                     d.name == simplified_name
    //                 ),  ({standardized_entered_name}) => standardized_entered_name)
    //         console.log(simplifiedNameData)
            
    //         let table_list = d3.select("tr#"+parent_id + " .expand ul")
    //         if(table_list.empty()){
    //             d3.select("tr#"+parent_id + " .expand").append("p").text("Standardized entered names:")
    //             table_list = d3.select("tr#"+parent_id + " .expand").append("ul")
    //         }

    //         let simplifiedNameEntries = Object.entries(simplifiedNameData)
    //             .sort((a, b) => b[1].length - a[1].length )
            
    //         table_list.selectAll("li")
    //             .data(simplifiedNameEntries)
    //             .join("li")
    //             .text((d) => `${d[0]} (${d[1].length})`)

            
    //     }
        
    // }


    
}

})





