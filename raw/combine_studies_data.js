import fs from 'fs'
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'


const STUDY_1_NAMES_I = "./study_v1/color_perception_table_color_names.csv"
const NAMES_O = "./color_names.csv"

// const STUDY_1_DEMOGRAPHICS_I = "./study_v1/color_perception_table_demographics.csv"
// const DEMOGRAPHICS_O = "./demographics.csv"


const color_names_writer = csvWriter();
color_names_writer.pipe(fs.createWriteStream(NAMES_O));

const v1_names = await csv().fromFile(STUDY_1_NAMES_I)
for(const colorNameRow of v1_names){
    delete colorNameRow.phaseNum
    delete colorNameRow.lab_l
    delete colorNameRow.lab_a
    delete colorNameRow.lab_b
    colorNameRow.colorSpace = "rgb"
    color_names_writer.write(colorNameRow)
}


// const demographics_writer = csvWriter();
// demographics_writer.pipe(fs.createWriteStream(DEMOGRAPHICS_O));
//
// const v1_demographics = await csv().fromFile(STUDY_1_DEMOGRAPHICS_I)
// for(const demographic of v1_demographics){
//     demographics_writer.write(demographic)
// }