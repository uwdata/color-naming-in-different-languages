import fs from 'fs'
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'


const PARTICIPANT_INFO_I = "../../../color-data/participantinfo_converted.csv"
const CHINA_REGIONS_I = "../supporting_files/chinaRegions.json"

const PARTICIPANT_INFO_O = "participant_info.csv"

const raw_participant_info = await csv().fromFile(PARTICIPANT_INFO_I)
const china_regions = JSON.parse(fs.readFileSync(CHINA_REGIONS_I))

// sanitize participant info
// and get China region (North/South)
for(const participant_row of raw_participant_info){
    delete participant_row.time
    delete participant_row.userAgent

    if(participant_row.ipCountry == "China"){
        const cityInfo = china_regions.cities.find(c => c.nameEn == participant_row.ipCity)
        if(cityInfo){
            if(cityInfo.regionKey){
                participant_row.ip_region = cityInfo.regionKey
            } else {
                const provinceInfo = china_regions.provinces.find(p => p.code = cityInfo.provinceCode)
                if(provinceInfo){
                    participant_row.ip_region = provinceInfo.regionKey
                } else{
                    console.log("could not find info for Chinese city: ", participant_row.ipCity)
                }
            }
            if(!participant_row.ip_region){
                console.log("how did I not get info for", participant_row.ipCity, "?")
            }
        } else{
            console.log("could not find Chinese city: ", participant_row.ipCity)
        }
    } else if(participant_row.ipCountry == "Taiwan"){
        const provinceInfo = china_regions.provinces.find(p => p.code = participant_row.ipCountry)
        if(provinceInfo){
            participant_row.ip_region = provinceInfo.regionKey
        } else{
            console.log("could not find info for Taiwan")
        }
    } else {
        participant_row.ip_region = ""
    }

    delete participant_row.ipCity
}

const demographics_writer = csvWriter()
demographics_writer.pipe(fs.createWriteStream(PARTICIPANT_INFO_O));

for(const participant_row of raw_participant_info){
    demographics_writer.write(participant_row)
}