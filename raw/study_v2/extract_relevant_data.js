import fs from 'fs'
import csv from 'csvtojson';
import JSON5 from 'json5'

const STUDY_2_DATA_I = "./download.csv"
const NAMES_O = "./study_2_data.json"
const DATA_STRUCTURE_O = "./data_structure.json"

const CHINA_REGIONS_I = "../supporting_files/chinaRegions.json"
const china_regions = JSON.parse(fs.readFileSync(CHINA_REGIONS_I))

const FIELDS_CONVERT_JSON = ["color_names", "matches"]

const FIELDS_TO_SAVE_SEPARATELY = [
    ["study", "comments", "comments", "comment-general"],
    ["study", "comments", "comments", "comment-issue"],
    ["study", "comments", "comments", "comment-whyexclude"]
]

const FIELDS_TO_IGNORE = [
    // timed study step tracking info
    "break", "comments", "demographics", "informed_consent", "introduction", "results", "studyStep1", "studyStep2", "studyStep3", "studyStep4", "studyStep5",
    
    // other tracking info that feels too specific
    ["litw", "initialize", "geoLoc", "city"],
    ["litw", "initialize", "geoLoc", "region"],
    ["litw", "initialize", "requester"],
    ["litw", "initialize", "userAgent"],
    ["litw", "initialize", "urlParams", "fbclid"],
    ["litw", "initialize", "urlParams", "REF"],
    ["litw", "initialize", "urlParams", "ref"],
    ["litw", "initialize", "urlParams", "utm_source"],
    ["litw", "tracking"],
    

    // delete comments in case there is any personalized info
    // and some demographic free text fields as well
    ["study", "comments"],
    ["study", "demographics", "demographics-color-work-details"],
    ["study", "demographics", "demographics-color-blindness-other"]
    
]

const PARTICIPANTS_TO_IGNORE = [
    "5d65af49-af88-4d2f-88ea-7ccb310f8256"
]

const study_2_data = await csv({checkType: true}).fromFile(STUDY_2_DATA_I)

const dataStructure = {}
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
    if(!PARTICIPANTS_TO_IGNORE.includes(participant.participant_id)){
        participantInfo.push(participant)
    }
}

// add Region for Chinese data
for(const participant_row of participantInfo){
    if(participant_row.litw.initialize.geoLoc.country == "China"){
        const regionInfo = china_regions.provinces.find(p => p.nameEn == participant_row.litw.initialize.geoLoc.region)
        if(regionInfo){
            participant_row.litw.initialize.geoLoc.simplifiedRegion = regionInfo.regionKey
        } else {
            const cityInfo = china_regions.cities.find(c => c.nameEn == participant_row.litw.initialize.geoLoc.city)
            if(cityInfo){
                if(cityInfo.regionKey){
                    participant_row.litw.initialize.geoLoc.simplifiedRegion = cityInfo.regionKey
                } else {
                    const provinceInfo = china_regions.provinces.find(p => p.code = cityInfo.provinceCode)
                    if(provinceInfo){
                        participant_row.litw.initialize.geoLoc.simplifiedRegion = provinceInfo.regionKey
                    } else{
                        console.log("could not find info for Chinese city: ", participant_row.litw.initialize.geoLoc.city)
                    }
                }
                if(!participant_row.litw.initialize.geoLoc.simplifiedRegion){
                    console.log("how did I not get info for", participant_row.litw.initialize.geoLoc.city, "?")
                }
            } else{
                console.log("could not find Chinese city: ", participant_row.litw.initialize.geoLoc.city)
            }
        }
    } else if(participant_row.litw.initialize.geoLoc.country == "Taiwan"){
        const provinceInfo = china_regions.provinces.find(p => p.code = participant_row.litw.initialize.geoLoc.country)
        if(provinceInfo){
            participant_row.litw.initialize.geoLoc.simplifiedRegion = provinceInfo.regionKey
        } else{
            console.log("could not find info for Taiwan")
        }
    }

}


// filter participants that have actual info or that we are intending to exclude
participantInfo = participantInfo.filter(p => {
    // exclude ones marked specifically as "test"
    if(p.litw.initialize.urlParams && (p.litw.initialize.urlParams.test || p.litw.initialize.urlParams.TEST)){
        return false
    }
    delete p.litw.initialize.urlParams.test
    delete p.litw.initialize.urlParams.TEST

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

for(const participant of participantInfo){
    for(const field of FIELDS_TO_SAVE_SEPARATELY){
        if(typeof field == "string"){
            if(participant[field]){
                console.log(participant[field])
            }
        } else { //assume array
            // clone array
            const fieldArray = [...field]
            let currObject = participant
            while(fieldArray.length > 1){
                const subField = fieldArray.shift()
                currObject = currObject[subField]
            }
            const finalField = fieldArray.shift()
            if(currObject[finalField]){
                console.log(JSON.stringify(currObject[finalField]))
            }
        }
    }
        
}

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

// Get final data structure (so we can track new information and make sure to filter out potentially sensitive data)
function addFields(participantInfoSubset, structureObjectSubset){
    for(const [key, vals] of Object.entries(participantInfoSubset)){
        if(!(key in structureObjectSubset)){
            structureObjectSubset[key] = {}
        }
        if(participantInfoSubset[key]?.constructor === Object){
            addFields(participantInfoSubset[key], structureObjectSubset[key])
        } else {
            structureObjectSubset[key] = ""
        }
    }
}

for(const participant of participantInfo){
    addFields(participant, dataStructure)
}

console.log("saving info from ", participantInfo.length, " participants")

fs.writeFileSync(NAMES_O, JSON.stringify(participantInfo, null, 2));

fs.writeFileSync(DATA_STRUCTURE_O, JSON.stringify(dataStructure, null, 2));
