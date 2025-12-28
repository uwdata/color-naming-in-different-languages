import fs from 'fs'
import csv from 'csvtojson';
import csvWriter from 'csv-write-stream'


const STUDY_1_NAMES_I = "./study_v1/color_perception_table_color_names.csv" 

const STUDY_2_I = "./study_v2/study_2_data.json"

const NAMES_O = "./color_names.csv"

const STUDY_1_DEMOGRAPHICS_I = "./study_v1/color_perception_table_demographics.csv"
const DEMOGRAPHICS_O = "./demographics.csv"

const NAME_MATCHES_O = "./color_name_matches.csv"

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


///////////// COLOR NAME MATCHES /////////////////

const color_name_matches_writer = csvWriter();
color_name_matches_writer.pipe(fs.createWriteStream(NAME_MATCHES_O));

for(const participant of v2_data){
    const color_name_match_sets = participant.study.data.color_name_match_set
    if(color_name_match_sets[COLOR_NAME_STEPS[0]].matches.length > 0){
        for(const step of COLOR_NAME_STEPS){
            const color_names = color_name_match_sets[step].matches
            for(const [name_match_i, name_match_info] of color_names.entries()){
                const colorNameMatchRow = {
                    participantId:  participant.participant_id,
                    lang: color_name_match_sets[step].lang0,
                    trialNum: color_name_match_sets[step].trialNum,
                    termNum: name_match_info.termNum,
                    colorNum: name_match_info.colorNum,
                    name: name_match_info.name,
                    displayName: name_match_info.displayName,
                    match: name_match_info.match,
                    colorSpace: name_match_info.colorSpace,
                    r: name_match_info.r,
                    g: name_match_info.g,
                    b: name_match_info.b,
                    rgbSet: color_name_match_sets[step].rgbSet,
                    studyVersion: color_name_match_sets[step].studyVersion,
                    locale: color_name_match_sets[step].locale,
                    background: color_name_match_sets[step].background,
                }
                color_name_matches_writer.write(colorNameMatchRow)
            }
        }
    }
}


///////////// Demographics /////////////////

const demographics_writer = csvWriter({
    headers: [
        "participantId",
        "date",
        "ipCountry", "ipRegion",
        "locale",
        "retake",
        "gender",

        // Study v2 country data
        "countryGrow", "countryLive", 
        // Study v1 country data
        "multinational", "country1", "country2", "country3", "country4", "country5",

        "education",

        "lang0", "lang1", "fluency1", "lang2", "fluency2",

        "age",
        "colorBlindness", "colorBlindnessOther",
        "colorWork", "colorWorkDetails",
        "readingAboutColor",
        "surroundingBrightness", "surroundingBrightIDK",
        "monitorBrightness", "monitorBrightIDK",
        "backgroundColor",
        "displayColorSpace"
    ]});
demographics_writer.pipe(fs.createWriteStream(DEMOGRAPHICS_O));

const v1_demographics = await csv({delimiter: ";"}).fromFile(STUDY_1_DEMOGRAPHICS_I)
for(const demographic of v1_demographics){
    //demographics_writer.write(demographic)
    if(demographic.participantId == 0){ // Study error
        continue
    }
    const demographicRow = {
        participantId:  demographic.participantId,
        date: (new Date(demographic.current_time)).getFullYear(),
        ipCountry: undefined, // todo: do we have this saved elsewhere?
        ipRegion: undefined, // todo: do we have this saved elsewhere?
        locale: undefined, // todo: get this information from naming data?
        retake: demographic.retake == 0 ? "no" : "yes",
        gender: demographic.gender == 0 ? "male" : demographic.gender == 1 ? "female" : "other",
        // countryGrow: 
        // countryLive:
        multinational: demographic.multinational == 0 ? "no" : "yes",
        country1: demographic.country1,
        country2: demographic.country2,
        country3: demographic.country3,
        country4: demographic.country4,
        country5: demographic.country5,
        education: demographic.education,
        lang0: demographic.lang0,
        lang1: demographic.lang1,
        fluency1: demographic.fluency1,
        lang2: demographic.lang2,
        fluency2: demographic.fluency2,
        age: demographic.age,
        colorBlindness: demographic.colorBlindness,
        colorBlindnessOther: demographic.colorBlindnessText0,
        colorWork: demographic.colorWork == 0 ? "no" : "yes",
        colorWorkDetails: demographic.colorWorkText0,
        readingAboutColor: demographic.colorReading ? demographic.colorReading.toLowerCase() : demographic.colorReading,
        surroundingBrightness: demographic.surrBrightnessSlider,
        surroundingBrightIDK: demographic.surrBrightIDK,
        monitorBrightness: demographic.mBrightnessSlider,
        monitorBrightIDK: demographic.mBrightIDK,
        backgroundColor: "white",
        displayColorSpace: "rgb"
    }
    demographics_writer.write(demographicRow)
}

for(const participant of v2_data){
    const demographicRow = {
        participantId:  participant.participant_id,
        date:  participant.litw.initialize.date,
        ipCountry:  participant.litw.initialize.geoLoc.country,
        ipRegion:  participant.litw.initialize.geoLoc.region,
        locale:  participant.litw.initialize.contentLanguage,
        retake: participant.study.demographics["demographics-retake"],
        gender: participant.study.demographics["demographics-gender"] !== "other" ? 
            participant.study.demographics["demographics-gender"] :
            participant.study.demographics["demographics-gender-other"],
        countryGrow: participant.study.demographics["demographics-country-grow"] !== "other" ? 
            participant.study.demographics["demographics-country-grow"] :
            participant.study.demographics["demographics-country-grow-other"],
        countryLive: participant.study.demographics["demographics-country-live"] !== "other" ? 
            participant.study.demographics["demographics-country-live"] :
            participant.study.demographics["demographics-country-live-other"],
        // multinational: 
        // country1:
        // country2:
        // country3:
        // country4:
        // country5:
        education: participant.study.demographics["demographics-education"],
        lang0: participant.study.demographics["demographics-lang0"] !== "Other" ? 
            participant.study.demographics["demographics-lang0"] :
            participant.study.demographics["demographics-lang0-other"],
        lang1: participant.study.demographics["demographics-more-lang"] ? 
            (
                participant.study.demographics["demographics-more-lang"]["demographics-lang1"] !== "Other" ?
                    participant.study.demographics["demographics-more-lang"]["demographics-lang1"] :
                    participant.study.demographics["demographics-more-lang"]["demographics-lang1-other"]
            )
            : undefined,
        fluency1: participant.study.demographics["demographics-more-lang"] ? participant.study.demographics["demographics-more-lang"]["demographics-lang1-fluency"] : undefined,
        lang2: participant.study.demographics["demographics-more-lang"] ? 
            (
                participant.study.demographics["demographics-more-lang"]["demographics-lang2"] !== "Other" ?
                    participant.study.demographics["demographics-more-lang"]["demographics-lang2"] :
                    participant.study.demographics["demographics-more-lang"]["demographics-lang2-other"]
            )
            : undefined,
        fluency2: participant.study.demographics["demographics-more-lang"] ? participant.study.demographics["demographics-more-lang"]["demographics-lang2-fluency"] : undefined,
        age: participant.study.demographics["demographics-age"],
        colorBlindness: participant.study.demographics["demographics-color-blindness"],
        colorBlindnessOther: participant.study.demographics["demographics-color-blindness-other"],
        colorWork: participant.study.demographics["demographics-color-work"],
        colorWorkDetails: participant.study.demographics["demographics-color-work-details"],
        readingAboutColor: participant.study.demographics["demographics-color-reading"],
        surroundingBrightness: participant.study.demographics["demographics-surrounding-brightness"] ?  participant.study.demographics["demographics-surrounding-brightness"]["demographics-surrounding-brightness-value"] : undefined,
        surroundingBrightIDK: participant.study.demographics["demographics-surrounding-brightness"] ? participant.study.demographics["demographics-surrounding-brightness"]["demographics-surrounding-brightness-idk"] : undefined,
        monitorBrightness: participant.study.demographics["demographics-monitor-brightness"] ? participant.study.demographics["demographics-monitor-brightness"]["demographics-monitor-brightness-value"] : undefined,
        monitorBrightIDK: participant.study.demographics["demographics-monitor-brightness"] ?  participant.study.demographics["demographics-monitor-brightness"]["demographics-monitor-brightness-idk"] : undefined,
        backgroundColor: participant.study.demographics.background,
        displayColorSpace: participant.study.demographics.colorSpace
    }
    demographics_writer.write(demographicRow)
}
