import csv from 'csvtojson';
import fs from 'fs'


const FILE_COLOR_SORTING_I = "../../raw/color_sorting.csv"
const FILE_COLOR_SORTING_START_SHUFFLE_I = "../../raw/color_sorting_tile_start_shuffle.csv"
const FILE_DEMOGRAPHICS_I = "../../raw/demographics.csv"
const FILE_SORTING_TILE_INFO_I = "../../raw/color_sorting_tiles_info.csv"
const FILE_SORTING_AVERAGES_O = "../../model/sortingAverages.json"

const setN = 6
const N = 15

const colorSortingData = await csv().fromFile(FILE_COLOR_SORTING_I)
const colorSortingStartShuffleData = await csv().fromFile(FILE_COLOR_SORTING_START_SHUFFLE_I)
const demographics = await csv().fromFile(FILE_DEMOGRAPHICS_I)
const tileInfo = await csv().fromFile(FILE_SORTING_TILE_INFO_I)

console.log("calculating start shuffle")

const startShuffles = {}
for(const i of Array(setN).keys()){
    const index = i + 1
    const shuffle = []
    for(const j of Array(N).keys()){
        const tileNum = j + 1
        const shuffleTileInfo = colorSortingStartShuffleData.find(s => s.color_set_num == index && s.color_tile_at_this_location == tileNum)
        shuffle.push(shuffleTileInfo.color_set_tile_num)
    }
    startShuffles[index] = shuffle.join(",")
}

// TODO: calculate scores for all users (some finished sorting but score wasn't calculated)
const zeroscores = colorSortingData.filter(s => s.sort_score == 0)
                .filter(s => 
                        s.userSort1 && s.userSort2 && s.userSort3 && s.userSort4 && s.userSort5 && s.userSort6
                    )
console.log(zeroscores)



console.log("pre-processing tile sorts")
const colorSortingDataSortsParsed = 
    // make sure all userSorts exist
    colorSortingData.filter(s => 
        s.userSort1 && s.userSort2 && s.userSort3 && s.userSort4 && s.userSort5 && s.userSort6
    )
    // make sure each color tile set has been modified at least once
    .filter(s => 
        (s.userSort1 != startShuffles[1] || s.userSort1Drags > 0) &&
        (s.userSort2 != startShuffles[2] || s.userSort2Drags > 0) &&
        (s.userSort3 != startShuffles[3] || s.userSort3Drags > 0) &&
        (s.userSort4 != startShuffles[4] || s.userSort4Drags > 0) &&
        (s.userSort5 != startShuffles[5] || s.userSort5Drags > 0) &&
        (s.userSort6 != startShuffles[6] || s.userSort6Drags > 0)
    )
    .map(s => {
        const tileSort = {}
        const tileNums = {}
        const tileError = {}
        const maxTileError = {}
        for(const i of Array(setN).keys()){
            const index = i + 1
            if(!s["userSort" + index] ){
                console.log("undefined user sort")
            }
            tileSort[index] = s["userSort" + index].split(",").map(a => parseInt(a))
            const N = tileSort[index].length
            tileNums[index] = tileSort[index].map((tilePlaced, tileIndex) => tileIndex + 1)
            tileError[index] = tileSort[index].map((tilePlaced, tileIndex) => Math.abs(tileIndex - tilePlaced + 1)) // how many places this tile is away from correct)
            maxTileError[index] = tileSort[index].map((tilePlaced, tileIndex) => Math.max(tileIndex - 0, N - 1 - tileIndex)) // the most wrong this tile can be
        }

        s.tileSort = tileSort
        s.tileNums = tileNums
        s.tileError = tileError
        s.maxTileError = maxTileError

        return s
    })




console.log("calculating averages")

const scoreAvgs = []

/**
 * 
 * @param {*} options: version, colorBlindness
 * 
 */
function findSortAvgs(options){
    console.log("calculating averages for ", options)
    let sortData = colorSortingDataSortsParsed
    
    // clear 0s
    // TODO: Fill in scores for those missing score values, probably upstream in raw data processing
    sortData = sortData.filter((csd) => csd.sort_score !== "")


    if(options.version == 1){
        sortData = sortData.filter(csd => csd.studyVersion == 1)
    } else if(options.version == 2) {
        sortData = sortData.filter(csd => csd.studyVersion == 2)
    }

    if(options.colorBlindness){
        sortData = sortData.filter(s => s.participantId != 0 ? 
            demographics.find(d => d.participantId == s.participantId) ? 
                demographics.find(d => d.participantId == s.participantId).colorBlindness == options.colorBlindness :
                false
            : false)
    }

    if(options.backgroundColor){
        sortData = sortData.filter(s => s.participantId != 0 ? 
            demographics.find(d => d.participantId == s.participantId) ? 
                demographics.find(d => d.participantId == s.participantId).backgroundColor == options.backgroundColor :
                false
            : false)
    }

    if(options.displayColorSpace){
        sortData = sortData.filter(s => s.participantId != 0 ? 
            demographics.find(d => d.participantId == s.participantId) ? 
                demographics.find(d => d.participantId == s.participantId).displayColorSpace == options.displayColorSpace :
                false
            : false)
    }

    if(sortData.length == 0){
        console.log("could not find data for ", options)
        return
    }

    const sortScores = sortData.map(s => parseFloat(s.sort_score))

    // calculate average errors 
    const tileErrors = []
    for(const i of Array(setN).keys()){
        const index = i + 1
        for(const j of Array(N).keys()){
            const tileNum = j + 1
            const thisTileErrors = sortData.map(s => s.tileError[index][j])
            const thisTileAvgError = thisTileErrors.reduce((a, b) => a + b) / thisTileErrors.length
            tileErrors.push({
                sortSet: index,
                tileNum: tileNum,
                avgErrorAmount: thisTileAvgError,
                maxError: sortData[0].maxTileError[index][j],
                color: tileInfo.find(t => 
                    "v" + options.version == t.study_version &&
                    index == t.color_set_num &&
                    tileNum == t.color_set_tile_num )
                    .color_string
            })
        }

    // 
    //       const data = fulldata.tileErrors.map((d, i) => {
    //     //study_version,color_index,color_set_num,color_set_tile_num,r,g,b,color_string
    //     const thisTileInfo = tileInfo.find(t => 
    //         "v" + fulldata.version == t.study_version &&
    //         d.sortSet == t.color_set_num &&
    //         d.tileNum == t.color_set_tile_num )
        
    //     return {
    //         ...d, 
    //         error: d.avgErrorAmount,
    //         ...thisTileInfo, 
    //         color: d3.rgb(thisTileInfo.color_string),
    //         index: i
    //     }
    // })

    }


    scoreAvgs.push({
        avgScore: sortScores.reduce((a, b) => a + b) / sortScores.length,
        numScores: sortScores.length,
        version: options.version,
        colorBlindness: options.colorBlindness,
        backgroundColor: options.backgroundColor,
        displayColorSpace: options.displayColorSpace,
        tileErrors: tileErrors
    })
}

findSortAvgs({
    version: 1
})


findSortAvgs({
    version: 1,
    colorBlindness: "none"
})

findSortAvgs({
    version: 1,
    colorBlindness: "red-green"
})

findSortAvgs({
    version: 1,
    colorBlindness: "blue-yellow"
})

findSortAvgs({
    version: 1,
    colorBlindness: "total"
})

findSortAvgs({
    version: 1,
    colorBlindness: "other"
})


findSortAvgs({
    version: 2
})

findSortAvgs({
    version: 2,
    colorBlindness: "none"
})

findSortAvgs({
    version: 2,
    colorBlindness: "red-green"
})

findSortAvgs({
    version: 2,
    colorBlindness: "blue-yellow"
})

findSortAvgs({
    version: 2,
    colorBlindness: "total"
})

findSortAvgs({
    version: 2,
    colorBlindness: "other"
})

// more options:
// findSortAvgs({
//     version: 2,
//     colorBlindness: "none",
//     backgroundColor: "white",
//     displayColorSpace: "rgb"
// })

// findSortAvgs({
//     version: 2,
//     colorBlindness: "none",
//     backgroundColor: "black",
//     displayColorSpace: "p3"
// })


//console.log(scoreAvgs)

// Write
fs.writeFileSync(FILE_SORTING_AVERAGES_O, JSON.stringify(scoreAvgs))



// // to compute max error for scores, reverse the list and see how bad it is (this should be close enough to correct)
// var maxError = 0;
// for(var i = 0; i < N; i++){
//     var currentPointError = Math.abs(i - (N - 1 - i));
//     maxError += Math.pow(currentPointError, 2);
// }
// maxError *= setN; // there are 6 sets

// var score = 1 - results.reduce(function(prev,curr){ 
//     prev += Math.pow(curr.error, 2);
//     return prev;
// }, 0) / maxError;

// //to make scores (between 0 and 1) distributed better so not everyone scores 99+, 
// // and to keep the range between 0 and 1 and to particularly separate high scores
// //  do basically (1 - sqrt(1 - score)), but with a slighlty different exponent so one error rounds as 99
// score = 1 - Math.pow(1 - score, .55);

// // make all scores less than 35.2 (the starting error) be 0
// score = Math.max(0, (score - 0.352) / (1 - 0.352));
