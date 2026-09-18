import csv from 'csvtojson';
import fs from 'fs'


const FILE_COLOR_SORTING_I = "../../raw/color_sorting.csv"
const FILE_COLOR_SORTING_START_SHUFFLE_I = "../../raw/color_sorting_tile_start_shuffle.csv"
const FILE_DEMOGRAPHICS_I = "../../raw/demographics.csv"
const FILE_SORTING_AVERAGES_O = "../../model/sortingAverages.json"

const setN = 6
const N = 15

const colorSortingData = await csv().fromFile(FILE_COLOR_SORTING_I)
const colorSortingStartShuffleData = await csv().fromFile(FILE_COLOR_SORTING_START_SHUFFLE_I)
const demographics = await csv().fromFile(FILE_DEMOGRAPHICS_I)

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
        s.userSort1 != startShuffles[1] && s.userSort2 != startShuffles[2] && s.userSort3 != startShuffles[3] &&
        s.userSort4 != startShuffles[4] && s.userSort5 != startShuffles[5] && s.userSort6 != startShuffles[6]
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
                maxError: sortData[0].maxTileError[index][j]
            })
        }


    }


    scoreAvgs.push({
        avgScore: sortScores.reduce((a, b) => a + b) / sortScores.length,
        numScores: sortScores.length,
        version: options.version,
        colorBlindness: options.colorBlindness,
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


//console.log(scoreAvgs)

// Write
fs.writeFileSync(FILE_SORTING_AVERAGES_O, JSON.stringify(scoreAvgs))

// from color_sorting: find average score


// graph y axis is, for each tile: error / maxError 

// find average tile error, and broken down for color blindness options


// var colorSets = expData.resultsColorSets;
	
// var results = colorSets.reduce(function(prev, colorSet, setIndex){
//     var splicedColorSet = colorSet.slice(1, colorSet.length - 1);
//     prev = prev.concat(splicedColorSet.map(function(color, index, array){
//         return { 
//             "error" : Math.abs(index - userResponses[setIndex][index] + 1), // how many places this tile is away from correct
//             "maxError": Math.max(index - 0, N - 1 - index), // the most wrong this tile can be
//             "color" : color,
//             "index" : index + setIndex*N
//         };     
//     }));
//     return prev;
// },[]);

// //ORDER BY sortSet ASC, tileNum ASC
// let averageTileErrorData = window.averageTileErrors.sort((a, b) => a.sortSet == b.sortSet ? a.tileNum - b.tileNum : a.sortSet - b.sortSet)
// let averageTileErrors = averageTileErrorData.map(d => d.avgErrorAmount)
// var avgUserResults = [];
// for(var i = 0; i < results.length; i++){
//     avgUserResults[i] = {
//         "error" : averageTileErrors[i],
//         "maxError": results[i].maxError,
//         "color" : results[i].color,
//         "index" : results[i].index
//     }
// }


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


//window.average_score = 0.918787

// window.averageTileErrors = [
//  {"id":101, "sortSet":1, "tileNum":1, "avgErrorAmount":0.321063},
//  {"id":102, "sortSet":1, "tileNum":2, "avgErrorAmount":0.160888},
//  {"id":103, "sortSet":1, "tileNum":3, "avgErrorAmount":0.386849},
//  {"id":104, "sortSet":1, "tileNum":4, "avgErrorAmount":0.446665},
//  {"id":105, "sortSet":1, "tileNum":5, "avgErrorAmount":0.39489},
//  {"id":106, "sortSet":1, "tileNum":6, "avgErrorAmount":0.20323},
//  {"id":107, "sortSet":1, "tileNum":7, "avgErrorAmount":0.161057},
//  {"id":108, "sortSet":1, "tileNum":8, "avgErrorAmount":0.163025},
//  {"id":109, "sortSet":1, "tileNum":9, "avgErrorAmount":0.240585},
//  {"id":110, "sortSet":1, "tileNum":10, "avgErrorAmount":0.148979},
//  {"id":111, "sortSet":1, "tileNum":11, "avgErrorAmount":0.231662},
//  {"id":112, "sortSet":1, "tileNum":12, "avgErrorAmount":0.493791},
//  {"id":113, "sortSet":1, "tileNum":13, "avgErrorAmount":0.171812},
//  {"id":114, "sortSet":1, "tileNum":14, "avgErrorAmount":0.518389},
//  {"id":115, "sortSet":1, "tileNum":15, "avgErrorAmount":0.366565},
//  {"id":201, "sortSet":2, "tileNum":1, "avgErrorAmount":0.194184},
//  {"id":202, "sortSet":2, "tileNum":2, "avgErrorAmount":0.453278},
//  {"id":203, "sortSet":2, "tileNum":3, "avgErrorAmount":0.442352},
//  {"id":204, "sortSet":2, "tileNum":4, "avgErrorAmount":0.141965},
//  {"id":205, "sortSet":2, "tileNum":5, "avgErrorAmount":0.26096},
//  {"id":206, "sortSet":2, "tileNum":6, "avgErrorAmount":0.186245},
//  {"id":207, "sortSet":2, "tileNum":7, "avgErrorAmount":0.330517},
//  {"id":208, "sortSet":2, "tileNum":8, "avgErrorAmount":0.336319},
//  {"id":209, "sortSet":2, "tileNum":9, "avgErrorAmount":0.260586},
//  {"id":210, "sortSet":2, "tileNum":10, "avgErrorAmount":0.330755},
//  {"id":211, "sortSet":2, "tileNum":11, "avgErrorAmount":0.476215},
//  {"id":212, "sortSet":2, "tileNum":12, "avgErrorAmount":0.23222},
//  {"id":213, "sortSet":2, "tileNum":13, "avgErrorAmount":0.149905},
//  {"id":214, "sortSet":2, "tileNum":14, "avgErrorAmount":0.413918},
//  {"id":215, "sortSet":2, "tileNum":15, "avgErrorAmount":0.491721},
//  {"id":301, "sortSet":3, "tileNum":1, "avgErrorAmount":0.252095},
//  {"id":302, "sortSet":3, "tileNum":2, "avgErrorAmount":0.311921},
//  {"id":303, "sortSet":3, "tileNum":3, "avgErrorAmount":0.164139},
//  {"id":304, "sortSet":3, "tileNum":4, "avgErrorAmount":0.395059},
//  {"id":305, "sortSet":3, "tileNum":5, "avgErrorAmount":0.118531},
//  {"id":306, "sortSet":3, "tileNum":6, "avgErrorAmount":0.440734},
//  {"id":307, "sortSet":3, "tileNum":7, "avgErrorAmount":0.237606},
//  {"id":308, "sortSet":3, "tileNum":8, "avgErrorAmount":0.0803556},
//  {"id":309, "sortSet":3, "tileNum":9, "avgErrorAmount":0.273881},
//  {"id":310, "sortSet":3, "tileNum":10, "avgErrorAmount":0.118158},
//  {"id":311, "sortSet":3, "tileNum":11, "avgErrorAmount":0.136652},
//  {"id":312, "sortSet":3, "tileNum":12, "avgErrorAmount":0.432454},
//  {"id":313, "sortSet":3, "tileNum":13, "avgErrorAmount":0.132987},
//  {"id":314, "sortSet":3, "tileNum":14, "avgErrorAmount":0.618175},
//  {"id":315, "sortSet":3, "tileNum":15, "avgErrorAmount":0.388171},
//  {"id":401, "sortSet":4, "tileNum":1, "avgErrorAmount":0.208871},
//  {"id":402, "sortSet":4, "tileNum":2, "avgErrorAmount":0.390267},
//  {"id":403, "sortSet":4, "tileNum":3, "avgErrorAmount":0.60396},
//  {"id":404, "sortSet":4, "tileNum":4, "avgErrorAmount":0.250411},
//  {"id":405, "sortSet":4, "tileNum":5, "avgErrorAmount":0.358993},
//  {"id":406, "sortSet":4, "tileNum":6, "avgErrorAmount":0.277264},
//  {"id":407, "sortSet":4, "tileNum":7, "avgErrorAmount":0.568448},
//  {"id":408, "sortSet":4, "tileNum":8, "avgErrorAmount":0.349896},
//  {"id":409, "sortSet":4, "tileNum":9, "avgErrorAmount":0.586679},
//  {"id":410, "sortSet":4, "tileNum":10, "avgErrorAmount":0.484929},
//  {"id":411, "sortSet":4, "tileNum":11, "avgErrorAmount":0.775237},
//  {"id":412, "sortSet":4, "tileNum":12, "avgErrorAmount":0.519309},
//  {"id":413, "sortSet":4, "tileNum":13, "avgErrorAmount":0.741186},
//  {"id":414, "sortSet":4, "tileNum":14, "avgErrorAmount":0.941617},
//  {"id":415, "sortSet":4, "tileNum":15, "avgErrorAmount":0.76961},
//  {"id":501, "sortSet":5, "tileNum":1, "avgErrorAmount":0.99335},
//  {"id":502, "sortSet":5, "tileNum":2, "avgErrorAmount":0.448155},
//  {"id":503, "sortSet":5, "tileNum":3, "avgErrorAmount":0.402448},
//  {"id":504, "sortSet":5, "tileNum":4, "avgErrorAmount":0.461454},
//  {"id":505, "sortSet":5, "tileNum":5, "avgErrorAmount":0.559993},
//  {"id":506, "sortSet":5, "tileNum":6, "avgErrorAmount":0.249361},
//  {"id":507, "sortSet":5, "tileNum":7, "avgErrorAmount":0.21772},
//  {"id":508, "sortSet":5, "tileNum":8, "avgErrorAmount":0.339459},
//  {"id":509, "sortSet":5, "tileNum":9, "avgErrorAmount":0.146365},
//  {"id":510, "sortSet":5, "tileNum":10, "avgErrorAmount":0.268579},
//  {"id":511, "sortSet":5, "tileNum":11, "avgErrorAmount":0.326452},
//  {"id":512, "sortSet":5, "tileNum":12, "avgErrorAmount":0.257654},
//  {"id":513, "sortSet":5, "tileNum":13, "avgErrorAmount":0.652612},
//  {"id":514, "sortSet":5, "tileNum":14, "avgErrorAmount":0.549982},
//  {"id":515, "sortSet":5, "tileNum":15, "avgErrorAmount":0.277311},
//  {"id":601, "sortSet":6, "tileNum":1, "avgErrorAmount":0.636895},
//  {"id":602, "sortSet":6, "tileNum":2, "avgErrorAmount":0.217293},
//  {"id":603, "sortSet":6, "tileNum":3, "avgErrorAmount":0.238415},
//  {"id":604, "sortSet":6, "tileNum":4, "avgErrorAmount":0.0917994},
//  {"id":605, "sortSet":6, "tileNum":5, "avgErrorAmount":0.104005},
//  {"id":606, "sortSet":6, "tileNum":6, "avgErrorAmount":0.331348},
//  {"id":607, "sortSet":6, "tileNum":7, "avgErrorAmount":0.100534},
//  {"id":608, "sortSet":6, "tileNum":8, "avgErrorAmount":0.370669},
//  {"id":609, "sortSet":6, "tileNum":9, "avgErrorAmount":0.390915},
//  {"id":610, "sortSet":6, "tileNum":10, "avgErrorAmount":0.29696},
//  {"id":611, "sortSet":6, "tileNum":11, "avgErrorAmount":0.117709},
//  {"id":612, "sortSet":6, "tileNum":12, "avgErrorAmount":0.222811},
//  {"id":613, "sortSet":6, "tileNum":13, "avgErrorAmount":0.427204},
//  {"id":614, "sortSet":6, "tileNum":14, "avgErrorAmount":0.277226},
//  {"id":615, "sortSet":6, "tileNum":15, "avgErrorAmount":0.164523}
// ];