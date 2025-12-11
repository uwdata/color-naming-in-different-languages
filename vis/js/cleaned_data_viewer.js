$(document).on('ready page:load', async () => {

const cleanedColorNames = await d3.csv("../model/cleaned_color_names.csv");
console.log(cleanedColorNames[0]);

const allNamesByLang = Object.groupBy(cleanedColorNames, ({lang0}) => lang0)

console.log(Object.keys(allNamesByLang))

//let selected_lang = "English (English)"
let selected_lang = Object.keys(allNamesByLang).find(a => a.startsWith("Greek"))

$("#selected_langs").empty()
let selected_lang_temp = true
for(lang of Object.keys(allNamesByLang)){
    $("#selected_langs").append(new Option(lang, lang, true, selected_lang_temp))
    selected_lang_temp = false
}

$("#selected_langs").change(e => { 
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
        const commonName = d3.groups(
                gTerm[1], 
                    t => t.standardized_entered_name)
                .map(a => {
                    return {key: a[0], values: a[1]}})
                .sort((a,b) => -a.values.length + b.values.length)[0]
                .key
        
        const standardized_entered_name_count = d3.groups(
                gTerm[1], 
                    t => t.standardized_entered_name).length
        return {
            commonName: commonName,
            simplified_name: gTerm[1][0].name,
            data_count: gTerm[1].length,
            standardized_name_count: standardized_entered_name_count,
            expand: "+"
        }
    })
}


// filter by length more than 1
for(let [lang, langData] of Object.entries(groupedNamesByLang)){
    groupedNamesByLang[lang] = langData
        .filter(d => d.data_count > 1)
}


// sort by name
for(let [lang, langData] of Object.entries(groupedNamesByLang)){
    groupedNamesByLang[lang] = langData
        .sort((a, b) => a.commonName.localeCompare(b.commonName))
}

$("#data_view").empty()
    

const table = d3.select("#data_view")
    .append("table")

table.selectAll("th")
        .data(Object.keys(groupedNamesByLang[selected_lang][0]))
        .join("th")
        .text(d => d)

updateTableData();

function updateTableData(){
    const selected_lang = $("#selected_langs").val()

    const nameData = groupedNamesByLang[selected_lang]
    const rows = table
        .selectAll("tr")
        .data(Object.entries(nameData))
        .join("tr")
            .attr("test2", "test2")
            .attr("id", (d) => 
                "name_" + d[0])
    
    const tds = rows.selectAll("td")
        // .data(d => [
        //     ["name", d[1].name],
        //     ["standardized_entered_name", d[1].standardized_entered_name],
        //     ["entered_name", d[1].entered_name]
        // ])
        .data(d => Object.entries(d[1]))
        .join("td")
        .attr("class", (d) => d[0] == "expand" ? "expand" : undefined)
        .text(d => {
            return d[1]
        })
        .on("click", expandCommonName)


    function expandCommonName(event, d){
        console.log(event, d)
        if(d[0] == "expand"){
            const parent_id = event.currentTarget.parentNode.id
            const name_i = parseInt(parent_id.split("name_")[1])
            const simplified_name = nameData[name_i].simplified_name
            console.log(simplified_name)
            const simplifiedNameData = Object.groupBy(
                allNamesByLang[selected_lang]
                    .filter(d => 
                        d.name == simplified_name
                    ),  ({standardized_entered_name}) => standardized_entered_name)
            console.log(simplifiedNameData)
            
            let table_list = d3.select("tr#"+parent_id + " .expand ul")
            if(table_list.empty()){
                d3.select("tr#"+parent_id + " .expand").append("p").text("Standardized entered names:")
                table_list = d3.select("tr#"+parent_id + " .expand").append("ul")
            }

            let simplifiedNameEntries = Object.entries(simplifiedNameData)
                .sort((a, b) => b[1].length - a[1].length )
            
            table_list.selectAll("li")
                .data(simplifiedNameEntries)
                .join("li")
                .text((d) => `${d[0]} (${d[1].length})`)

            
        }
        
    }


    
}

})





