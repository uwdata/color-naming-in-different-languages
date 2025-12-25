const STANDARDIZED_NAME_COL = "Standardized Names"

const rawDataRowSort = [
    "reason_excluded", "entered_name", "standardized_entered_name", "name",
    "lang0", "lang0Abv", "participantId", "rgbSet",
    "studyVersion", "locale", "phaseNum", "trialNum","tileNum", "background",
    "colorSpace", "r", "g", "b", "originalLang0Abv"
]

$(document).on('ready page:load', async () => {

let cleanedColorNames, removedColorData

await Promise.all([
    d3.csv("../model/cleaned_color_names.csv").then(data => {
        cleanedColorNames = data
    }),
    d3.csv("../model/removed_color_data.csv").then(data => {
        removedColorData = data
    })
])
console.log(cleanedColorNames[0]);
console.log(removedColorData[0]);

const allNamesByLang = Object.groupBy(cleanedColorNames, ({lang0}) => lang0)
const allRemovedNamesByLang = Object.groupBy(removedColorData, ({lang0}) => lang0)

const allLangs = Array.from(new Set([
                    ...Object.keys(allNamesByLang), 
                    ...Object.keys(allRemovedNamesByLang)]))
                .sort()
console.log(Object.keys(allLangs))

//let selected_lang = "English (English)"
let selected_lang = allLangs.find(a => a.startsWith("Greek"))

$("#selected_langs").empty()

for(lang of allLangs){
    let selected_lang_temp = lang.startsWith("Greek")
    $("#selected_langs").append(new Option(
        `${lang} ‎(${ // Note LTR character here to make arrows show 
            allNamesByLang[lang] ? allNamesByLang[lang].length.toLocaleString() : 0} - ${
            allRemovedNamesByLang[lang] ? allRemovedNamesByLang[lang].length.toLocaleString() : 0})`, 
        lang, true, selected_lang_temp))
    selected_lang_temp = false
}

$("#selected_langs").change(e => { 
    updateTableData()
})

$("#min_name_count").change(e => { 
    updateTableData()
})

$("#selected_langs").change(e => { 
    updateTableData()
})

$("input[name='cleaned-or-deleted']").change(e => {
    updateTableData()
})


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
        
        const color_sample = getColorSample(gTerm[1], 9)
        
        return {
            "Common Name": commonName,
            "simplified name": gTerm[1][0].name,
            "Color Sample": color_sample,
            "data count": gTerm[1].length,
            "Standardized Names": termGroup,
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


updateTableData();

function updateTableData(){
    $(table.node()).empty()

    const selected_lang = $("#selected_langs").val()

    const datasetShown = $("input[name='cleaned-or-deleted']:checked").val()
    console.log("datasetShown", datasetShown)
    if(datasetShown == "removed"){
        showRawData(allRemovedNamesByLang[selected_lang], table, true, cleanedColorNames, removedColorData)
        $("#filter_lang_note").hide()
        $("#min_name_count_div").hide()
        return
    }
    $("#filter_lang_note").show()
    $("#min_name_count_div").show()
    
    table.selectAll("th")
        .data(Object.keys(groupedNamesByLang[selected_lang][0]))
        .join("th")
        .text(d => d)
   

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
            .attr("data-name-i", d => d[0])
    
    const tds = rows.selectAll("td")
        .data(d => Object.entries(d[1]).map((a, a_i) => {
            a[2] = a_i
            return a
        }))
        .join("td")
        .style("text-align", d => d[0] == STANDARDIZED_NAME_COL ? "left" : undefined)
        .html((d) => {
            if(d[0] == STANDARDIZED_NAME_COL){
                return `<ul>
                ${d[1]
                    .sort((a, b) => b[1].length - a[1].length)
                    .map((a, a_i) => 
                        $("<li></li>")
                        .append(
                            $(`<a href="#" data-name-standardized-i=${a_i}></a>`).text(`${a[0]} (${a[1].length})`)
                        ).append(
                            getColorSample(a[1], 3).map(c => `&nbsp<span style="background-color:${c};">&nbsp &nbsp</span>`).join("")
                        )
                        .prop('outerHTML'))
                    .join("")}
                </ul>`
            }else if(d[0] == "Color Sample") {
                const size = 10
                return `
                <div class="d-flex flex-row">
                ${d[1].map(
                    c => `<div style="background-color:${c};height:${size}px;width:${size}px"></div>`).join("")
                }
                </div>
                `
            } else {
                return $('<span />').text(d[1]).prop('outerHTML')
            }
        })

    tds.selectAll("td a")
        .on("click", showStandardizedNameInfo)

    function showStandardizedNameInfo(event){
        event.preventDefault()
        const name_standardized_i = event.target.dataset.nameStandardizedI
        const name_i = $(event.target).parents("tr")[0].dataset.nameI

        const standardized_name_entry = nameData[name_i][STANDARDIZED_NAME_COL][name_standardized_i]
        const standardized_name = standardized_name_entry[0]
        const standardized_name_data = standardized_name_entry[1]

        // the display modal with data
        $('#standardized-name-modal').modal('show');

        $('#standardized-name-modal .modal-title').text("Color Summary: " + standardized_name);

        $('#standardized-name-modal button.download').unbind("click")
        $('#standardized-name-modal button.download').on("click", () => {
            const csvContent = "data:text/csv;charset=utf-8," + d3.csvFormat(standardized_name_data)

            // based on:
            // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
            var encodedUri = encodeURI(csvContent);
            $("#tmp-downloader").remove()
            var link = document.createElement("a");
            link.setAttribute("id", "tmp-downloader");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${standardized_name}_cleaned_data.csv`);
            document.body.appendChild(link); // Required for FF

            link.click();
        });


        const standardized_modal_body = d3.select('#standardized-name-modal .modal-body')
        
        showRawData(standardized_name_data, standardized_modal_body, true, cleanedColorNames, removedColorData)
    }    
}

})


function showRawData(dataset, tableElement, linkToParticipantInfo, cleanedColorNames, removedColorData){
    if(!dataset || dataset.length == 0){
        tableElement.text("No data")
        return
    }
    
    $(tableElement.node()).empty()

    tableElement
        .selectAll("th")
        .data(["Color", ...Object.keys(dataset[0]).sort((a, b) => rawDataRowSort.indexOf(a) - rawDataRowSort.indexOf(b))])
        .join("th")
        .text(d => d)

    const rows = tableElement
    .selectAll("tr")
    .data(Object.entries(dataset))
    .join("tr")
        .attr("test2", "test2")


    const tds = rows.selectAll("td")
        .data(d => {
            const sortedEntries =  Object.entries(d[1])
                .sort((a, b) => rawDataRowSort.indexOf(a[0]) - rawDataRowSort.indexOf(b[0]))
            sortedEntries.unshift(["Color", getColorString(
                sortedEntries.find(a => a[0] == "colorSpace")[1],
                sortedEntries.find(a => a[0] == "r")[1],
                sortedEntries.find(a => a[0] == "g")[1],
                sortedEntries.find(a => a[0] == "b")[1]
            )])
            return sortedEntries
        })
        .join("td")
        .html(d => {
            if(d[0] == "Color") {
                return `<div 
                    style="background-color:${d[1]};height:20px;width:50px;border:solid black 1px"></div>`
            } else if(d[0] == "participantId" && linkToParticipantInfo) {
                if(d[1] == "0"){
                    return "0 (survey error)"
                } 
                const link = $('<a href="#" />').text(d[1])
                link.attr("data-participant-id", d[1])
                return link.prop('outerHTML')
            }else {
                return $('<span />').text(d[1]).prop('outerHTML')
            }
        })

    function showParticipantInfo(e){
        console.log("show participant info")
        e.preventDefault()

        const participantId =  e.target.dataset.participantId

        $("#participant-info-modal").modal("show")

        $("#participant-info-modal .modal-title").text("Participant Info: " + participantId)

        const cleanedTable = d3.select('#participant-info-modal .modal-body .cleaned-data table')
        const removeTable = d3.select('#participant-info-modal .modal-body .removed-data table')

         showRawData(cleanedColorNames.filter(a => a.participantId == participantId), 
            cleanedTable, false, cleanedColorNames, removedColorData)
         showRawData(removedColorData.filter(a => a.participantId == participantId), 
            removeTable, false, cleanedColorNames, removedColorData)

    }

    tds.selectAll("td a")
        .on("click", showParticipantInfo)
}




function getColorString(colorSpace, r, g, b){
    if(colorSpace == "rgb"){
        return `rgb(${r},${g},${b})`
    }
    if(colorSpace == "p3"){
        return `color(display-p3 ${r} ${g} ${b})`
    }
    if(colorSpace == "rec2020"){
        return `color(rec2020 ${r} ${g} ${b})`
    }
}

function getColorSample(dataRows, maxColors){
    let color_sample = []
    if(dataRows.length <= maxColors){
        color_sample = dataRows.map(a => getColorString(a.colorSpace, a.r, a.g, a.b))
    }else{
        // TODO: randomly sample instead of just choosing first 9
        const rand_is = []
        while(rand_is.length < maxColors){
            const rand_i = Math.floor(Math.random() * dataRows.length)
            if(!rand_is.includes(rand_i)){
                rand_is.push(rand_i)
            }
        }
        color_sample = rand_is.map(i => getColorString(dataRows[i].colorSpace, dataRows[i].r, dataRows[i].g, dataRows[i].b))
    }
    return color_sample
}