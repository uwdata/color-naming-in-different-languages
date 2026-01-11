
$(document).on('ready page:load', async () => {

let cleanedColorNames

await Promise.all([
    d3.csv("../model/cleaned_color_names.csv").then(data => {
        cleanedColorNames = data
    })
])
console.log(cleanedColorNames[0]);

const allNamesByLang = Object.groupBy(cleanedColorNames, ({lang}) => lang)

//OPTIONAL FILTER FOR JUST HUE COLORS
for(let [lang, langData] of Object.entries(allNamesByLang)){
    allNamesByLang[lang] = langData.filter(d=> d.rgbSet == "line")
}

const allLangs = Array.from(new Set([
                    ...Object.keys(allNamesByLang)]))
                .sort()
console.log(Object.keys(allLangs))

//let selected_lang = "English (English)"
let selected_lang = allLangs.find(a => a.startsWith("Greek"))

$("#selected_langs").empty()

for(lang of allLangs){
    let selected_lang_temp = lang.startsWith("Greek")
    $("#selected_langs").append(new Option(
        `${lang} ‎(${ // Note LTR character here to make arrows show 
            allNamesByLang[lang] ? allNamesByLang[lang].length.toLocaleString() : 0}`, 
        lang, true, selected_lang_temp))
    selected_lang_temp = false
}

$("#selected_langs").change(e => {
    updateForceDirectedGraph()
})

$("#min_name_count").change(e => { 
    updateForceDirectedGraph()
})

$("#selected_langs").change(e => { 
    updateForceDirectedGraph()
})


$("input[name='naming-or-matching']").change(e => {
    updateForceDirectedGraph()
})

const allParticipantsByLang = {}
for(let [lang, langData] of Object.entries(allNamesByLang)){
    allParticipantsByLang[lang] = []
    for(const row of langData){
        if(!allParticipantsByLang[lang].includes(row.participantId)){
            allParticipantsByLang[lang].push(row.participantId)
        }
    }
}



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
        

        // TODO: hue and full participant ids, then make switch
        const participantIds = new Set(gTerm[1].map(a => a.participantId))
        const color_sample = getColorSample(gTerm[1], 9)
        const okLabColorSamples = color_sample.map(d=> new Color(d).to("oklab"))
        const avgSampleOkLabColor = new Color({
            space: "oklab",
            coords: [
                okLabColorSamples.map(d => d.l).reduce((a,b)=>a+b) / color_sample.length,
                okLabColorSamples.map(d => d.a).reduce((a,b)=>a+b) / color_sample.length,
                okLabColorSamples.map(d => d.b).reduce((a,b)=>a+b) / color_sample.length
            ]
        })
        const avgSampleRgb = avgSampleOkLabColor.to("srgb") + ""
        
        return {
            "id": gTerm[1][0].name,
            "Common Name": commonName,
            "simplified name": gTerm[1][0].name,
            "Color Sample": color_sample,
            "avgColor": avgSampleRgb,
            "participantIds": participantIds,
            "data count": gTerm[1].length,
            "Standardized Names": termGroup,
        }
    })
}

const groupedNamesByLangLinks = {}

// sort by name
for(let [lang, langData] of Object.entries(groupedNamesByLang)){
    groupedNamesByLang[lang] = langData
        .sort((a, b) => a["Common Name"].localeCompare(b["Common Name"]))
}

$("#data_view").empty()
    

const forceDirectedGraphSVG = d3.select("#data_view")
    .append("svg")


let simulation

updateForceDirectedGraph();



function updateForceDirectedGraph(){
    $(forceDirectedGraphSVG.node()).empty()
    if(simulation){
        simulation.stop()
    }

    const selected_lang = $("#selected_langs").val()

    let nameData = groupedNamesByLang[selected_lang]
    // filter by length more than 1
    const min_name_count = $("#min_name_count").val()
    const preLength = nameData.length
    if(min_name_count > 1){
        nameData = nameData.filter(d => d["data count"] > min_name_count)
        $("#filter_lang_note").text(`Filtered down from ${preLength.toLocaleString()}, to ${nameData.length.toLocaleString()} names`)
    }else{
        $("#filter_lang_note").text(`Showing ${nameData ? nameData.length.toLocaleString() : 0} names`)
    }

    if(nameData.length > 100){
        nameData = nameData.sort((a,b) =>b["data count"] - a["data count"]).slice(0, 100)
         $("#filter_lang_note").text(`For speed reasons, truncated data down from ${preLength.toLocaleString()}, to ${nameData.length.toLocaleString()} names`)
    }

    // Specify the dimensions of the chart.
    const width = 928;
    const height = 680;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    //if(!groupedNamesByLangLinks[selected_lang]){
        console.log("calculating links for ", selected_lang)
        groupedNamesByLangLinks[selected_lang] = []
        let maxLinkStrength = 0
        for(const term1 of nameData){
            console.log("term1", term1["simplified name"])
            for(const term2 of nameData){
                if(term1 != term2){
                    // how many participants have used both terms?
                    let numSharedParticipants = 0
                    for(const participantId of allParticipantsByLang[selected_lang]){
                        if(participantId != "0"){
                            if(term1.participantIds.has(participantId) &&
                                term2.participantIds.has(participantId)){
                                numSharedParticipants++
                            }
                        }
                    }

                    const linkStrength = numSharedParticipants * numSharedParticipants

                    if(linkStrength > 0){
                        groupedNamesByLangLinks[selected_lang].push({
                            "source": term1["simplified name"],
                            "target": term2["simplified name"],
                            "value": linkStrength
                        })
                    }
                    if(linkStrength > maxLinkStrength){
                        maxLinkStrength = linkStrength
                    }
                }
            }
        }

        for(const link of groupedNamesByLangLinks[selected_lang]){
            link.value = link.value / maxLinkStrength
        }
        console.log("found links", groupedNamesByLangLinks[selected_lang])
   // }

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = groupedNamesByLangLinks[selected_lang].map(d => ({...d}));
    const nodes = nameData.map(d => ({...d}));

    const maxNodeCount = Math.max(...nodes.map(d=>d["data count"]))

    // Create a simulation with several forces.
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    // Create the SVG container.
    const svg = forceDirectedGraphSVG
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .selectAll(".data-node")
        .data(nodes)
        .join("g")
        .attr("class", "data-node" )

    const nodeCircles = node
        .append("circle")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("r", d => 15 * 
            d["data count"] / maxNodeCount + 5)
        .attr("fill", d => d.avgColor);

    node.append("title")
        .text(d => d["Common Name"]);

    node.append("text")
            .text(d => d["Common Name"])
            .attr("font-size", "smaller")

    // Add a drag behavior.
    node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`)
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }


    // from Observable code, not sure if tis is needed???

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());


    }
})





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
