import fs from 'fs'
import csv from 'csvtojson';
import JSON5 from 'json5'

const STUDY_2_DATA_I = "./download.csv"
const NAMES_O = "./study_2_data.json"

const FIELDS_CONVERT_JSON = ["color_names", "matches"]

const FIELDS_TO_IGNORE = [
    // timed study step tracking info
    "break", "comments", "demographics", "informed_consent", "introduction", "results", "studyStep1", "studyStep2", "studyStep3", "studyStep4", "studyStep5",
    
    // other tracking info that feels too specific
    ["litw", "initialize", "geoLoc", "city"],
    ["litw", "initialize", "geoLoc", "region"],
    ["litw", "initialize", "requester"],
    ["litw", "initialize", "userAgent"],
    ["litw", "initialize", "urlParams", "fbclid"],
    ["litw", "tracking"],
    

    // delete comments in case there is any personalized info
    ["study", "comments"]
]

const study_2_data = await csv({checkType: true}).fromFile(STUDY_2_DATA_I)

let participantInfo = []

for(const participant_row of study_2_data){
    const participant = {}
    for(const [col, data] of Object.entries(participant_row)){
        let currObject = participant
        const dataLocation = col.split(":")
        while(dataLocation.length > 1){
            const field = dataLocation.shift()
            if(!(field in currObject)){
                currObject[field] = {}
            }
            currObject = currObject[field]
        }
        const lastLocation = dataLocation.shift()

        let outputData = data
        if(FIELDS_CONVERT_JSON.includes(lastLocation)){
            if(data !== ""){
                // Note: For some reason the data file was saved with single quotes, so use JSON5 to parse it
                outputData = JSON5.parse(data)
            }
        }

        // for date field, simplify to year for further anonymization
        if(lastLocation == "date"){
            outputData = (new Date(data)).getFullYear()
        }

        currObject[lastLocation] = outputData
    }
    participantInfo.push(participant)
}


// filter participants that have actual info or that we are intending to exclude
participantInfo = participantInfo.filter(p => {
    // exclude ones marked specifically as "test"
    if(p.litw.initialize.urlParams && p.litw.initialize.urlParams.test){
        return false
    }

    if(p.study.data.color_sorting_results[1].sortTiles[1].tilesOrder.length > 0){
        return true
    }
    if(p.study.data.color_name_match_set[1].matches.length > 0){
        return true
    }
    if(p.study.data.color_name_set[1].color_names.length > 0){
        return true
    }
    return false
})

// Delete information we aren't interested in using
for(const participant of participantInfo){
    for(const field of FIELDS_TO_IGNORE){
        if(typeof field == "string"){
            delete participant[field]
        } else { //assume array
            // clone array
            const fieldArray = [...field]
            let currObject = participant
            while(fieldArray.length > 1){
                const subField = fieldArray.shift()
                currObject = currObject[subField]
            }
            delete currObject[fieldArray.shift()]
        }
        
    }
}

// console.log(JSON.stringify(participantInfo, null, 2))
console.log("saving info from ", participantInfo.length, " participants")

fs.writeFileSync(NAMES_O, JSON.stringify(participantInfo, null, 2));

