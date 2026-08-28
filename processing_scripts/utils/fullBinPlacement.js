import fs from 'fs'
import * as labBinHelperLib from '../utils/labBinHelper.js'
import Color from "colorjs.io";

// Number of colors in a bin we require to output data for that bin
const MIN_NperBin = 4;

// Number of bins kept in order for us to confidently calculate color space ratio and binned average colors
const MIN_FRACTION_BIN_FOR_RES = 0.9


function fullBinPlacement(lang_info, grouped_lang, basicColorInfoLookup, labBinSize, binResSizeString){

    const full_colors_info = {}
    const lang_bin_info = {}
    const lang_bin_blur_info = {}

      
    const labBinHelper = labBinHelperLib.getLabBins(labBinSize);
    
    const [dim1, dim2, dim3] = labBinSize.dims

    const [dim1BinName, dim2BinName, dim3BinName] = labBinSize.dims.map(d => "bin"+d.toUpperCase())

    // TODO: Transform between different colorspaces (for now we reduce all to srgb)
    const lab_bins_arr_full = JSON.parse(fs.readFileSync(`../../model/color_info_pre_naming/oklab_bins_${labBinSize}.json`))
    
    const lab_bins_arr = labBinSize.filterBinsByGamut(lab_bins_arr_full, "rgb") // filter for only the rgb bins while we only have rgb data

    console.log("for only rgb data, reducing ", lab_bins_arr_full.length, " bins down to", lab_bins_arr.length, "bins")

    const lab_bins = labBinHelper.binsArrayToNested(lab_bins_arr)


    let blurWeights
    let areBlurWeightsRelativePosition
    if(labBinSize.type == "ring"){
    blurWeights = getBlurWeightsForBins(labBinSize, lab_bins_arr)
    areBlurWeightsRelativePosition = false
    } else {
    blurWeights = getBlurWeights(labBinSize)
    areBlurWeightsRelativePosition = true
    }



    let flatten = [], saliency = [],
        flattenBlur = [], saliencyBlur = [];

    grouped_lang.forEach(langData => {
        // make a shallow copy of langData and langData terms so we can track values for this binning
        langData = {...langData}
        langData.terms = [...langData.terms]

        console.log("Start : " + langData.key);

        
        if(!(langData.key in lang_bin_info)){
            lang_bin_info[langData.key] = {
                lang: langData.key,
                langAbv: lang_info.find(d => d.lang == langData.key).langAbv
            }
            lang_bin_blur_info[langData.key] = {
                lang: langData.key,
                langAbv: lang_info.find(d => d.lang == langData.key).langAbv
            }
        }

        // place colors in bins
        langData.terms.forEach(term => {
            term.binColorNameCnt = labBinHelper.createLABNumBins(lab_bins)      
            term.binColorEntries = labBinHelper.createLABNumBins(lab_bins)

            term.values.forEach(response => {
            let dim1Bin, dim2Bin, dim3Bin
            if(labBinSize.type == "ring"){
                const responseOklch =response.responseOklch;
                [dim1Bin, dim2Bin, dim3Bin] = labBinHelper.bins_from_lch({l: responseOklch.l, c: responseOklch.c, h: responseOklch.h})
            } else {
                const responseOklab = response.responseOklab;
                [dim1Bin, dim2Bin, dim3Bin] = labBinHelper.bins_from_lab({l: responseOklab.l, a: responseOklab.a, b: responseOklab.b}) 
            }

            // make sure bin exists
            if(!(dim1Bin in term.binColorEntries) || 
                !(dim2Bin in term.binColorEntries[dim1Bin]) ||
                !(dim3Bin in term.binColorEntries[dim1Bin][dim2Bin])){

                console.log("ERROR: MISSING BIN: ", dim1Bin, dim2Bin, dim3Bin)
                console.log("FOR BIN SIZE, " + labBinSize)
                console.log("and color, ", response.colorSpace, response.r, response.g, response.b )
                return
            }

            term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] += 1;

            if(term.binColorEntries[dim1Bin][dim2Bin][dim3Bin] == 0){
                term.binColorEntries[dim1Bin][dim2Bin][dim3Bin] = []
            }
            term.binColorEntries[dim1Bin][dim2Bin][dim3Bin].push(response)
            });
        });


        // calculate blur of color name counts across bins (by name)
        for(const term of langData.terms){
            term.binColorNameCntBlur = labBinHelper.createLABNumBins(lab_bins)

            for(let i = 0; i < lab_bins_arr.length; i++){
                const thisBin = lab_bins_arr[i]

                const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]
                
                const thisBlurWeights = labBinSize.type == "ring" ? 
                    blurWeights[dim1Bin][dim2Bin][dim3Bin]
                :
                    blurWeights
                term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] = getFieldBlur(thisBlurWeights, areBlurWeightsRelativePosition, term, dim1Bin, dim2Bin, dim3Bin, "binColorNameCnt")
            }
        }

        // calculate total counts for the bins and blurred bins
        let langBinColorNameCnt = labBinHelper.createLABNumBins(lab_bins);
        let langBinColorNameCntBlur = labBinHelper.createLABNumBins(lab_bins);
        for(const term of langData.terms){
            term.totalColorNameCnt = 0
            term.totalColorNameCntBlur = 0
            
            for(const thisBin of lab_bins_arr){
            const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]

            langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] += term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin];
            langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] += term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin];
            
            term.totalColorNameCnt += term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin]
            term.totalColorNameCntBlur += term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin]
            }
        }

        // find P of Term given Color for each bin
        langData.terms.forEach(term => {
            term.binPTC = labBinHelper.createLABNumBins(lab_bins)
            term.totalPTC = 0

            for(let i = 0; i < lab_bins_arr.length; i++){
                const thisBin = lab_bins_arr[i]

                const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]
                
                if(langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] == 0 && term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] == 0){
                term.binPTC[dim1Bin][dim2Bin][dim3Bin] = 0
                } else {
                term.binPTC[dim1Bin][dim2Bin][dim3Bin] = term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] / langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin]
                term.totalPTC += term.binPTC[dim1Bin][dim2Bin][dim3Bin]
                }
            }
        })

        // find blur for P(Term|Color) for each bin
        //   note: For where the totalColorNameCnt < MIN_NperBin
        //     only use that fractional value
        langData.terms.forEach(term => {
            term.binPTCBlur = labBinHelper.createLABNumBins(lab_bins)
            term.totalPTCBlur = 0

            for(let i = 0; i < lab_bins_arr.length; i++){
                const thisBin = lab_bins_arr[i]

                const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]

                const thisBlurWeights = labBinSize.type == "ring" ? 
                    blurWeights[dim1Bin][dim2Bin][dim3Bin]
                :
                    blurWeights

                
                // Resize blurWeights based on MIN_NperBin and resize blurWeights to sum of 1
                const standardizedBlurWeights = standardizeBlurWeightsIncludingCounts(thisBlurWeights, areBlurWeightsRelativePosition, langBinColorNameCnt, dim1Bin, dim2Bin, dim3Bin)
                // get blurred PCT value
                term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin] = getFieldBlur(standardizedBlurWeights, areBlurWeightsRelativePosition, term, dim1Bin, dim2Bin, dim3Bin, "binPTC")
                
                term.totalPTCBlur += term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin]
            }
        })

        // TODO: Filter by MIN_NperBin before finding P(Color|Term) ?
        // also move P(Color|Term) to after finding average and color space fraction
        // for translation, should I keep all bins?

        // calculate P(Color|Term) (both blur and not)
        langData.terms.forEach(term => {
            term.binPCT = labBinHelper.createLABNumBins(lab_bins)
            term.binPCTBlur = labBinHelper.createLABNumBins(lab_bins)


            for(let i = 0; i < lab_bins_arr.length; i++){
                const thisBin = lab_bins_arr[i]

                const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]
                
                term.binPCT[dim1Bin][dim2Bin][dim3Bin] = term.binPTC[dim1Bin][dim2Bin][dim3Bin] / term.totalPTC
                term.binPCTBlur[dim1Bin][dim2Bin][dim3Bin] = term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin] / term.totalPTCBlur
            }
        })

        const langTermBinsBuff = [];
        const langTermBinsBlurBuff = [];

        // Calculate term average color (bin scaled)
        // and term fraction of color space
        if(binResSizeString){

            // see if there is enough data to save info
            let keptBins = 0
            let numBins = 0
            for(let i = 0; i < lab_bins_arr.length; i++){
            const thisBin = lab_bins_arr[i]
            const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]
            numBins++
            if (langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin) {
                keptBins++
            }
            }
            if(keptBins / numBins > MIN_FRACTION_BIN_FOR_RES){

                // Make initial entries if needed
                if(!(langData.key in full_colors_info)){
                    full_colors_info[langData.key] = {}
                }
                for(const term of langData.terms){
                    if(!(term.key in full_colors_info[langData.key])){
                        full_colors_info[langData.key][term.key] = {
                            lang: langData.key,
                            lang_abv: lang_info.find(d => d.lang == langData.key).langAbv,
                            commonName: basicColorInfoLookup[langData.key][term.key].commonName,
                            simplifiedName: term.key
                        }
                    }

                    // calculate term average color (bin scaled)
                    // calculate bin color fraction (using p(T|C) and reducing weight for low-data bins)
                    let sumL = 0
                    let sumA = 0
                    let sumB = 0
                    let totalEntries = 0

                    let sumBinTermProb = 0
                    let sumBinProb = 0

                    for(let i = 0; i < lab_bins_arr.length; i++){
                    const thisBin = lab_bins_arr[i]
                    const dim1Bin = thisBin[dim1 + "_bin"],
                        dim2Bin = thisBin[dim2 + "_bin"],
                        dim3Bin = thisBin[dim3 + "_bin"]

                    let lowBinCorrection = 1
                    if(langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] < MIN_NperBin){
                        lowBinCorrection = langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] / MIN_NperBin
                    }

                    if(term.binColorEntries[dim1Bin][dim2Bin][dim3Bin] !== 0){
                        for(const entry of term.binColorEntries[dim1Bin][dim2Bin][dim3Bin]){
                        const oklabcolor = entry.responseOklab
                        sumL += oklabcolor.l * lowBinCorrection
                        sumA += oklabcolor.a * lowBinCorrection
                        sumB += oklabcolor.b * lowBinCorrection
                        totalEntries += lowBinCorrection
                        }
                    }

                    sumBinTermProb += term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin] * lowBinCorrection
                    sumBinProb += lowBinCorrection
                    }

                    const avgColor = new Color({
                    space: "oklab", coords: [sumL / totalEntries, sumA / totalEntries, sumB / totalEntries]
                    })
                    const avgColorRgb = avgColor.to("sRGB").toGamut()

                    full_colors_info[langData.key][term.key][binResSizeString + "ResBlurTermFraction"] = sumBinTermProb / sumBinProb
                    full_colors_info[langData.key][term.key][binResSizeString + "ResBlurAvgRGBCode"] = `rgb(${Math.round(255*avgColorRgb.r)},${Math.round(255*avgColorRgb.g)},${Math.round(255*avgColorRgb.b)})`
                    full_colors_info[langData.key][term.key][binResSizeString + "ResBlurAvgL"] = avgColor.l
                    full_colors_info[langData.key][term.key][binResSizeString + "ResBlurAvgA"] = avgColor.a
                    full_colors_info[langData.key][term.key][binResSizeString + "ResBlurAvgB"] = avgColor.b

                    delete term.binColorEntries // we don't need the specific color entries anymore
                }        
            }
        }
        

        // gather term info
        langData.terms.forEach(term => {
            for(let i = 0; i < lab_bins_arr.length; i++){
            const thisBin = lab_bins_arr[i]

            const dim1Bin = thisBin[dim1 + "_bin"],
                    dim2Bin = thisBin[dim2 + "_bin"],
                    dim3Bin = thisBin[dim3 + "_bin"]

            if (term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin] !== 0 &&
                langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin
            ) {
                langTermBinsBuff.push({
                "lang": langData.key,
                "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
                "term": term.key,
                "commonTerm": basicColorInfoLookup[langData.key][term.key].commonName,
                [dim1BinName]: dim1Bin,
                [dim2BinName]: dim2Bin,
                [dim3BinName]: dim3Bin,
                "cnt": term.binColorNameCnt[dim1Bin][dim2Bin][dim3Bin],
                "pCT": term.binPCT[dim1Bin][dim2Bin][dim3Bin],
                "pTC": term.binPTC[dim1Bin][dim2Bin][dim3Bin]
                });
            }
            if (term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] !== 0 &&
                langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin
            ) {
                langTermBinsBlurBuff.push({
                "lang": langData.key,
                "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
                "term": term.key,
                "commonTerm": basicColorInfoLookup[langData.key][term.key].commonName,
                [dim1BinName]: dim1Bin,
                [dim2BinName]: dim2Bin,
                [dim3BinName]: dim3Bin,
                "cnt": term.binColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin],
                "pCT": term.binPCTBlur[dim1Bin][dim2Bin][dim3Bin],
                "pTC": term.binPTCBlur[dim1Bin][dim2Bin][dim3Bin]
                });
            }
            }
        })

        // gather bin info
        let bufSaliency = [];
        let bufSaliencyBlur = [];
        for(let i = 0; i < lab_bins_arr.length; i++){
            const thisBin = lab_bins_arr[i]

            const dim1Bin = thisBin[dim1 + "_bin"],
                dim2Bin = thisBin[dim2 + "_bin"],
                dim3Bin = thisBin[dim3 + "_bin"]
            if (langBinColorNameCnt[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin) {
            // bin representative color
            const rep_lab = "representative_lab" in lab_bins[dim1Bin][dim2Bin][dim3Bin] ? 
                lab_bins[dim1Bin][dim2Bin][dim3Bin].representative_lab
                :
                lab_bins[dim1Bin][dim2Bin][dim3Bin].center_lab
            
            
            // redo: 
            const thisBinTerms = [...langTermBinsBuff].filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin)
                                .sort((a, b) => b.pTC - a.pTC)

            // top term name info
            let maxpTC = thisBinTerms[0].pTC;
            const majorTerm = thisBinTerms[0].term

            const topTerms = thisBinTerms
                                .slice(0, 4)
                                .map(d => {return {
                                term: d.term, 
                                commonTerm: basicColorInfoLookup[langData.key][d.term].commonName, 
                                pTC: d.pTC
                                }})

            bufSaliency.push({
                "lang": langData.key,
                "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
                [dim1BinName]: dim1Bin,
                [dim2BinName]: dim2Bin,
                [dim3BinName]: dim3Bin,
                "lab": [rep_lab.l, rep_lab.a, rep_lab.b].join(","),
                "saliency": -entropy(thisBinTerms.map(d => d.pTC)),
                "maxpTC": maxpTC,
                "majorTerm": majorTerm,
                "commonTerm": basicColorInfoLookup[langData.key][majorTerm].commonName,
                "avgTermColor": basicColorInfoLookup[langData.key][majorTerm].avgFullColorRGBCode,
                "topTerms": topTerms
            });
            }
            // blurred version
            if (langBinColorNameCntBlur[dim1Bin][dim2Bin][dim3Bin] >= MIN_NperBin) {
            const rep_lab = "representative_lab" in lab_bins[dim1Bin][dim2Bin][dim3Bin] ? 
                lab_bins[dim1Bin][dim2Bin][dim3Bin].representative_lab
                :
                lab_bins[dim1Bin][dim2Bin][dim3Bin].center_lab

            const thisBinTerms = [...langTermBinsBlurBuff].filter(d => d[dim1BinName] === dim1Bin && d[dim2BinName] === dim2Bin && d[dim3BinName] === dim3Bin)
                        .sort((a, b) => b.pTC - a.pTC)

            const maxpTC = thisBinTerms[0].pTC;
            const majorTerm = thisBinTerms[0].term

            const topTerms = thisBinTerms
                                .slice(0, 4)
                                .map(d => {return {
                                term: d.term, 
                                commonTerm: basicColorInfoLookup[langData.key][d.term].commonName, 
                                pTC: d.pTC
                                }})

            bufSaliencyBlur.push({
                "lang": langData.key,
                "langAbv": lang_info.find(d => d.lang == langData.key).langAbv,
                [dim1BinName]: dim1Bin,
                [dim2BinName]: dim2Bin,
                [dim3BinName]: dim3Bin,
                "lab": [rep_lab.dim1, rep_lab.dim2, rep_lab.dim3].join(","),
                "saliency": -entropy(thisBinTerms.map(d => d.pTC)),
                "maxpTC": maxpTC,
                "majorTerm": majorTerm,
                "commonTerm": basicColorInfoLookup[langData.key][majorTerm].commonName,
                "avgTermColor": basicColorInfoLookup[langData.key][majorTerm].avgFullColorRGBCode,
                "topTerms": topTerms
            });
            }
        }
        
        console.log("End : " + langData.key);
        saliency = saliency.concat(bufSaliency);
        flatten = flatten.concat(langTermBinsBuff);
        saliencyBlur = saliencyBlur.concat(bufSaliencyBlur);
        flattenBlur = flattenBlur.concat(langTermBinsBlurBuff);


        lang_bin_info[langData.key][`num_bins`] = bufSaliency.length
        lang_bin_info[langData.key][`fraction_bins`] = bufSaliency.length / lab_bins_arr.length
        lang_bin_blur_info[langData.key][`num_bins`] = bufSaliencyBlur.length
        lang_bin_blur_info[langData.key][`fraction_bins`] = bufSaliencyBlur.length / lab_bins_arr.length
    
    });

    return {
        full_colors_info: full_colors_info,
        lang_bin_info: lang_bin_info,
        lang_bin_blur_info: lang_bin_blur_info,
        flatten: flatten, 
        saliency: saliency,
        flattenBlur: flattenBlur, 
        saliencyBlur: saliencyBlur
    }
}



function entropy(arr){
  return arr.reduce((acc, curr) => {
    acc += curr === 0 ? 0 : -1 * curr * Math.log2(curr);
    return acc;
  }, 0);
}





// We use a Guassian blur (truncated by distance to make it run faster, and output files to be smaller)
// NOTE: we make sure the center node is weight 1
// We also arbitrarily aim for a sum of blur weights to be about 2.5 
//      (1 from center, 1.5 from neighbors)
// because that is about what our first attempt was, and it worked pretty well

function getBlurWeights(binSize){
  if(binSize.type == "cube"){
    const blurWeights = {}
    let totalBlurWeights = 0
    let totalBlurNeighbors = 0
    for(let i of [-1,0,1]){
      blurWeights[i] = {}
      for(let j of [-1,0,1]){
        blurWeights[i][j] = {}
        for(let k of [-1,0,1]){
          const dist = Math.sqrt(i*i + j*j + k*k)
          if(dist < 2){ // always true in this case
            blurWeights[i][j][k] = Math.pow(2, (-3 * dist))
            totalBlurWeights+= blurWeights[i][j][k]
            totalBlurNeighbors++
          }
        }
      }
    }
    console.log("cube, totalBlurNeighbors", totalBlurNeighbors, "totalBlurWeights", totalBlurWeights)
    //    2.6021164865590976
    return blurWeights
  }
  if(binSize.type == "box"){
    let base_dist
    if(binSize.l > binSize.ab){
      base_dist = binSize.ab
    } else {
      throw new Error("Error, we expected a different dimension box, the code below would need to be modified")
    }

    const blurWeights = {}
    let totalBlurWeights = 0
    let totalBlurNeighbors = 0
    for(let i of [-1,0,1]){
      blurWeights[i] = {}
      const i_dist =  i*binSize.l/base_dist
      for(let j of [-2,-1,0,1,2]){
        blurWeights[i][j] = {}
        const j_dist =  j*binSize.ab/base_dist
        for(let k of [-2,-1,0,1,2]){
          const k_dist =  k*binSize.ab/base_dist
          const dist = Math.sqrt(i_dist*i_dist + j_dist*j_dist + k_dist*k_dist)
          if(dist <= 2.5){ // always true in this case
            blurWeights[i][j][k] = Math.pow(2, (-2.5 * dist))
            totalBlurWeights+= blurWeights[i][j][k]
            totalBlurNeighbors++
          }
        }
      }
    }
    console.log("box, totalBlurNeighbors", totalBlurNeighbors, "totalBlurWeights", totalBlurWeights)
    //    2.343
    return blurWeights
  }
  if(binSize.type == "ring"){
    throw new Error("Use getBlurWeightsForBins() function for 'ring' bins")
  }
  throw new Error("unexpected binSize type " + binSize.type)
}


function getBlurWeightsForBins(binSize, bins){
  let blurWeights = {}

  let base_dist
  if(!("c" in binSize)){
    throw new Error("We expected ring bin size with c value")
  }

  let exp_mult
  if(binSize.l > binSize.c){
    base_dist = (binSize.l + binSize.c) / 2
    if(binSize.h_divs == 8){
       base_dist = (binSize.l + 3*binSize.c) / 4
      exp_mult = -4
    } else {
      base_dist = (binSize.l + 3*binSize.c) / 4
      exp_mult = -2
    }
  } else {
    base_dist = binSize.l
    exp_mult = -3.5
  }

  const [dim1, dim2, dim3] = binSize.dims

  let sumTotalBlurWeights = 0
  let sumTotalBlurNeighbors = 0

  for(const bin of bins){
    const bin_dim_1 = bin[dim1+"_bin"]
    const bin_dim_2 = bin[dim2+"_bin"]
    const bin_dim_3 = bin[dim3+"_bin"]

    if(!(bin_dim_1 in blurWeights)){
      blurWeights[bin_dim_1] = {}
    }
    if(!(bin_dim_2 in blurWeights[bin_dim_1])){
      blurWeights[bin_dim_1][bin_dim_2] = {}
    }
    if(!(bin_dim_3 in blurWeights[bin_dim_1][bin_dim_2])){
      blurWeights[bin_dim_1][bin_dim_2][bin_dim_3] = {}
    }

    const [thisCenterL, thisCenterA, thisCenterB] = [bin.center_lab.l, bin.center_lab.a, bin.center_lab.b]

    const binBlurWeights = blurWeights[bin_dim_1][bin_dim_2][bin_dim_3]
    let totalBlurWeights = 0
    let totalBlurNeighbors = 0

    // find all bins less than dist 2 base_dist away
    for(const compareBin of bins){
      const [compareCenterL, compareCenterA, compareCenterB] = [compareBin.center_lab.l, compareBin.center_lab.a, compareBin.center_lab.b]
      const lDelta = (compareCenterL - thisCenterL) / base_dist
      const aDelta = (compareCenterA - thisCenterA) / base_dist
      const bDelta = (compareCenterB - thisCenterB) / base_dist
      const dist = Math.sqrt(lDelta*lDelta + aDelta*aDelta + bDelta*bDelta)
      if(dist < 1.8){ // then we keep the weight
        const i = compareBin[dim1+"_bin"]
        const j = compareBin[dim2+"_bin"]
        const k = compareBin[dim3+"_bin"]
        if(!(i in binBlurWeights)){
          binBlurWeights[i] = {}
        }
        if(!(j in binBlurWeights[i])){
          binBlurWeights[i][j] = {}
        }
        if(!(k in binBlurWeights[i][j])){
          binBlurWeights[i][j][k] = Math.pow(2, (exp_mult * dist))
          totalBlurWeights += binBlurWeights[i][j][k]
          totalBlurNeighbors++
        }
      }
    }

    sumTotalBlurWeights += totalBlurWeights
    sumTotalBlurNeighbors += totalBlurNeighbors


    // console.log("blur for bin ", bin_dim_1, bin_dim_2, bin_dim_3,
    //   " is ", totalNumBinsCompareBlur, " bins total weight ", totalFinalBinWeight)
    //console.log(binBlurWeights)
  }

  console.log("ring, avgTotalBlurNeighbors", sumTotalBlurNeighbors/bins.length, "avgTotalBlurWeights", sumTotalBlurWeights/bins.length)
  return blurWeights
}

// Resize blurWeights based on MIN_NperBin,
// then resize blurWeights to sum of 1
function standardizeBlurWeightsIncludingCounts(blurWeights, areBlurWeightsRelativePosition, langBinColorNameCnt, dim1Bin, dim2Bin, dim3Bin){
  const standardizedBlurWeights = {}
  let sumOfWeights = 0
  
  // Resize blurWeights based on MIN_NperBin and find sum of weights
  for(let i of Object.keys(blurWeights)){
    standardizedBlurWeights[i] = {}
    i = parseInt(i)
    const i_bin = areBlurWeightsRelativePosition ? dim1Bin + i : i
    for(let j of Object.keys(blurWeights[i])){
      standardizedBlurWeights[i][j] = {}
      j = parseInt(j)
      const j_bin = areBlurWeightsRelativePosition ? dim2Bin + j : j
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        const k_bin = areBlurWeightsRelativePosition ? dim3Bin + k : k
        if((i_bin) in langBinColorNameCnt &&
           (j_bin) in langBinColorNameCnt[i_bin] &&
           (k_bin) in langBinColorNameCnt[i_bin][j_bin]
        ){
          if(langBinColorNameCnt[i_bin][j_bin][k_bin] < MIN_NperBin){
            // if there is less than the MIN_NperBin data in the bin, then
            // reduce the weight to a fraction of the value (how close it is to MIN_NperBin)
            standardizedBlurWeights[i][j][k] = blurWeights[i][j][k] * langBinColorNameCnt[i_bin][j_bin][k_bin] / MIN_NperBin
          } else {
            standardizedBlurWeights[i][j][k] = blurWeights[i][j][k]
          }
          sumOfWeights += standardizedBlurWeights[i][j][k] 
        }
      }
    }
  }

  if(sumOfWeights == 0){
    return standardizedBlurWeights
  }

  // resize bins to add up to 1
  for(let i of Object.keys(standardizedBlurWeights)){
    i = parseInt(i)
    const i_bin = areBlurWeightsRelativePosition ? dim1Bin + i : i
    for(let j of Object.keys(standardizedBlurWeights[i])){
      j = parseInt(j)
      const j_bin = areBlurWeightsRelativePosition ? dim2Bin + j : j
      for(let k of Object.keys(standardizedBlurWeights[i][j])){
        k = parseInt(k)
        standardizedBlurWeights[i][j][k] = standardizedBlurWeights[i][j][k] / sumOfWeights
      }
    }
  }

  return standardizedBlurWeights
}


function getBlur(blurWeights, areBlurWeightsRelativePosition, binInfo, dim1Bin, dim2Bin, dim3Bin){
  let weightedSum = 0
  
  for(let i of Object.keys(blurWeights)){
    i = parseInt(i)
    const i_bin = areBlurWeightsRelativePosition ? dim1Bin + i : i
    for(let j of Object.keys(blurWeights[i])){
      j = parseInt(j)
      const j_bin = areBlurWeightsRelativePosition ? dim2Bin + j : j
      for(let k of Object.keys(blurWeights[i][j])){
        k = parseInt(k)
        const k_bin = areBlurWeightsRelativePosition ? dim3Bin + k : k
        if((i_bin) in binInfo &&
           (j_bin) in binInfo[i_bin] &&
           (k_bin) in binInfo[i_bin][j_bin]
        ){
          weightedSum += binInfo[i_bin][j_bin][k_bin] * 
                          blurWeights[i][j][k] 
        }
      }
    }
  }
  return weightedSum
}

function getFieldBlur(blurWeights, areBlurWeightsRelativePosition, termInfo, dim1Bin, dim2Bin, dim3Bin, field){
  const fieldInfo = termInfo[field]
  return getBlur(blurWeights, areBlurWeightsRelativePosition, fieldInfo, dim1Bin, dim2Bin, dim3Bin)
}

export {
    fullBinPlacement
}