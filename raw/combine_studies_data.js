import fs from 'fs'
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'


const STUDY_1_NAMES_I = "./study_v1/color_perception_table_color_names.csv" 

const STUDY_2_I = "./study_v2/study_2_data.json"

const NAMES_O = "./color_names.csv"

// const STUDY_1_DEMOGRAPHICS_I = "./study_v1/color_perception_table_demographics.csv"
// const DEMOGRAPHICS_O = "./demographics.csv"


const v2_data = JSON.parse(fs.readFileSync(STUDY_2_I))


const COLOR_NAME_STEPS = [1,3,5]
///////////// COLOR NAMES /////////////////

const color_names_writer = csvWriter({
    headers: [
        "participantId",
        "lang",
        "name",
        "colorSpace", "r", "g", "b",
        "trialNum", "tileNum",
        "rgbSet",
        "background",
        "locale",
        "studyVersion"
    ]});
color_names_writer.pipe(fs.createWriteStream(NAMES_O));

const v1_names = await csv().fromFile(STUDY_1_NAMES_I)
for(const colorNameRow of v1_names){
    colorNameRow.lang = colorNameRow.lang0
    delete colorNameRow.lang0

    delete colorNameRow.colorNameId
    delete colorNameRow.phaseNum
    delete colorNameRow.lab_l
    delete colorNameRow.lab_a
    delete colorNameRow.lab_b

    colorNameRow.colorSpace = "rgb"
    colorNameRow.background = "white"
    
    color_names_writer.write(colorNameRow)
}

for(const participant of v2_data){
    const color_name_sets = participant.study.data.color_name_set
    if(color_name_sets[COLOR_NAME_STEPS[0]].color_names.length > 0){
        for(const step of COLOR_NAME_STEPS){
            const color_names = color_name_sets[step].color_names
            for(const [name_i, name_info] of color_names.entries()){
                const colorNameRow = {
                    participantId:  participant.participant_id,
                    lang: color_name_sets[step].lang0,
                    trialNum: color_name_sets[step].trialNum,
                    tileNum: name_i,
                    name: name_info.name,
                    colorSpace: name_info.colorSpace,
                    r: name_info.r,
                    g: name_info.g,
                    b: name_info.b,
                    rgbSet: color_name_sets[step].rgbSet,
                    studyVersion: color_name_sets[step].studyVersion,
                    locale: color_name_sets[step].locale,
                    background: color_name_sets[step].background,
                }
                color_names_writer.write(colorNameRow)
            }
        }
    }
}


// const demographics_writer = csvWriter();
// demographics_writer.pipe(fs.createWriteStream(DEMOGRAPHICS_O));
//
// const v1_demographics = await csv().fromFile(STUDY_1_DEMOGRAPHICS_I)
// for(const demographic of v1_demographics){
//     demographics_writer.write(demographic)
// }