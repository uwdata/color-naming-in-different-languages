var SOM = require('../utils/SOM');

const fs = require('fs'),
  d3 = require('d3'),
  csv=require("csvtojson");;

MIN_NAMES_FOR_9_SOM = 19
MIN_NAMES_FOR_16_SOM = 201
const SOM_TRAIN_ITERATIONS = 20000
//const SOM_TRAIN_ITERATIONS = 100

let colorNamesAbrv = {
	"English": "en",
	'Korean': "ko",
	"Persian": "fa",
	"Chinese": "zh",
	"German": "de",
	"French": "fr",
	"Portuguese": "pt",
	"Spanish": "es",
	"Swedish": "sv",
	"Russian": "ru",
	"Dutch": "nl",
	"Polish": "pl",
	"Finnish": "fi",
	"Romanian": "ro"
};

let commonColorNameLookup = {};
  
csv().fromFile("../../model/cleaned_color_names.csv")
.then((namingData)=>{
csv().fromFile("../../model/full_colors_info.csv")
.then((colorInfo)=>{
csv().fromFile("../../model/lang_info.csv")
.then((lang_info)=> {
		console.log(colorInfo);
		createSOMs(colorInfo, namingData, lang_info);
});
});
});
 

function createSOMs(colorInfo, namingData, lang_info){
	let colorNames = {};
	colorInfo.forEach(color => {
		let langAbv = colorNamesAbrv[color.lang.split("(")[0].trim()];
		if(!langAbv){
			throw new Error("Could not find abbreviation for '"+color.lang.split("(")[0].trim()+"'");
		}

		if(!colorNames[langAbv]){
			colorNames[langAbv] = [];
		}

		colorNames[langAbv].push(color.simplifiedName);

		if(!commonColorNameLookup[langAbv]){
			commonColorNameLookup[langAbv] = [];
		}
		commonColorNameLookup[langAbv][color.simplifiedName] = color.commonName;
	});
	
	//en, fa, ko, zh
	
	
	console.log(colorNames.en.length);
	
	//let colorNames = ["연두", "초록", "green", "armygreen", "mint", "blue", "하늘", "파랑", "aqua", "cyan", "red", "magenta", "purple", "pink", "white", "cream", "black", "gray", "pastel", "neon"];
	
	outputJSON = {};
	Object.keys(colorNames).forEach(lang => {
		outputJSON[lang] = {};
		for(var i in colorNames[lang]){
			let colorName = colorNames[lang][i];
			
			let thisColorData = namingData.filter(function(item){
				return lang == colorNamesAbrv[item.lang0.split("(")[0].trim()] && 
						item.name == colorName
			}); 

			const numFullData = thisColorData.filter(d => d.rgbSet == "full").length
			const numLineData = thisColorData.filter(d => d.rgbSet == "line").length

			console.log(thisColorData.length);
			if(thisColorData.length == 0){
				console.log("Color name had no data", colorName, lang, i);
				continue
			}

			const hue_correction_multiplier = lang_info.find(d => d.langAbv == lang).hue_correction_multiplier
    		const non_hue_correction_multiplier = lang_info.find(d => d.langAbv == lang).non_hue_correction_multiplier

			// adjust corrections so largest is 1:
			const adj_hue_corr = hue_correction_multiplier / Math.max(hue_correction_multiplier, non_hue_correction_multiplier)
			const adj_non_hue_corr = non_hue_correction_multiplier / Math.max(hue_correction_multiplier, non_hue_correction_multiplier)
			
			var LABdata = [];
			for(var j in thisColorData){
				const c = thisColorData[j]
				let weightCorrection = 0
				// if hue color
				if( Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0){
					weightCorrection = adj_hue_corr
				} else {
					weightCorrection = adj_non_hue_corr
				}
				//c => Math.max(c.r, c.g, c.b) == 255 && Math.min(c.r, c.g, c.b) == 0
				labColor = RGBtoLAB(c.r,c.g,c.b);

				LABdata.push([labColor.l, labColor.a, labColor.b, weightCorrection]);
			}
			
			LABdata.sort(function() {
			  return .5 - Math.random();
			});
			
			
			let thisColorInfo = {};
			console.log("color:", colorName);
			
			thisColorInfo["commonColorName"] = commonColorNameLookup[lang][colorName];
			thisColorInfo["numRecords"] = thisColorData.length;
			thisColorInfo["numFullData"] = numFullData;
			thisColorInfo["numLineData"] = numLineData;
			thisColorInfo["totalColorFraction"] = colorInfo.find(c => c.lang_abv == lang && c.simplifiedName == colorName).totalColorFraction;
			thisColorInfo["representativeColor"] = colorInfo.find(c => c.lang_abv == lang && c.simplifiedName == colorName).avgColorRGBCode
			
			thisColorInfo["colorNodes4"] = createSOM(colorName, LABdata, 2);
			thisColorInfo["colorNodes4Excluded"] = findSOMExcludedAmount(thisColorInfo["colorNodes4"]);
			
			thisColorInfo["mostDenseNodeRGB"] = findMostDenseNode(thisColorInfo["colorNodes4"]).rgb;

			if(numFullData >= MIN_NAMES_FOR_9_SOM){
				thisColorInfo["colorNodes9"] = createSOM(colorName, LABdata, 3);
				thisColorInfo["colorNodes9Excluded"] = findSOMExcludedAmount(thisColorInfo["colorNodes9"]);
				thisColorInfo["mostDenseNodeRGB"] = findMostDenseNode(thisColorInfo["colorNodes9"]).rgb;
			}

			if(numFullData > MIN_NAMES_FOR_16_SOM){
				thisColorInfo["colorNodes16"] = createSOM(colorName, LABdata, 4);
				thisColorInfo["colorNodes16Excluded"] = findSOMExcludedAmount(thisColorInfo["colorNodes16"]);
				thisColorInfo["mostDenseNodeRGB"] = findMostDenseNode(thisColorInfo["colorNodes16"]).rgb;
			}

			outputJSON[lang][colorName] = thisColorInfo;

			
		}
	});
	fs.writeFileSync("../../model/colorSOMPatches.json", JSON.stringify(outputJSON));
}	
 
function createSOM(colorName, LABdata, size){

	
	let minNeighborhoodSize = size * .75; // 1.5 for size 2, 3 for size 4
	let numExcluded;
	
	let bestRatio = 1;
	let bestLeastDenseNode = 1;
	let bestSOM;
	
	do { // try to find a good SOM, that is no more than 20% of names left out of map
		
		let som = new SOM(size,size,3);
		
		initializeSOMNodes(som, size);
				
		if(minNeighborhoodSize < .01){
			console.log("giving up at", bestRatio, numExcluded / LABdata.length);
			break;
		}
		
		som.train(LABdata, SOM_TRAIN_ITERATIONS, minNeighborhoodSize);
		
		numExcluded = som.findDensity(LABdata, "PCgN", true);
		
		minNeighborhoodSize = minNeighborhoodSize/1.1;
		
		
		if(!bestSOM){
			bestRatio = numExcluded / LABdata.length;
			bestSOM = som;
			bestLeastDenseNode = findLeastDenseNode(som.neurons).PCgN;
		}
		
		
		//if better ratio and either better or decent least best node
		if(
			(numExcluded / LABdata.length < bestRatio && (bestRatio > .35 || findLeastDenseNode(som.neurons).PCgN >= bestLeastDenseNode || findLeastDenseNode(som.neurons).PCgN > .03)) ||
			// or better least dense node and ratio is ok or better than before
			(findLeastDenseNode(som.neurons).PCgN >= bestLeastDenseNode && (numExcluded / LABdata.length < .2 || numExcluded / LABdata.length < bestRatio ) )){
				
				bestRatio = numExcluded / LABdata.length;
				bestSOM = som;
				bestLeastDenseNode = findLeastDenseNode(som.neurons).PCgN;
		}

	
	} while(bestRatio > .2 || bestLeastDenseNode < .03)
		
	console.log("best ratio", bestRatio, "bestLeastDenseNode", bestLeastDenseNode);
		
	
	
	let outputJSON = [];
	
	
	//     also try each rotation and see which is closest to initialized SOM to keep orientation roughly the same
	
	let neurons = bestOrientation(bestSOM.neurons, size);
	
	for(let i = 0; i < size; i++){
		let heightNodeArray = [];
		for(let j = 0; j < size; j++){
			let weights = neurons[i][j].weights;
			var labColor = d3.lab(weights[0], weights[1], weights[2]);
			let rgb = labColor.rgb();
			
			heightNodeArray.push({
				lab: {
					l: labColor.l,
					a: labColor.a,
					b: labColor.b
				},
				rgb: rgb.toString(),
				PCgN: neurons[i][j].PCgN
			});
			
		}
		outputJSON.push(heightNodeArray);
	}
	
	
	
	return outputJSON;

}	

function findSOMExcludedAmount(somJson){
	var excludedAmount = 1;
	for(var i = 0; i < somJson.length; i++){
		for(var j = 0; j < somJson[i].length; j++){
			excludedAmount -= somJson[i][j].PCgN;
		}
	}
	return excludedAmount;
}

function findMostDenseNode(somJson){
	var mostDense = 0;
	var mostDenseNode = somJson[0][0];
	for(var i = 0; i < somJson.length; i++){
		for(var j = 0; j < somJson[i].length; j++){
			if(somJson[i][j].PCgN > mostDense){
				mostDense = somJson[i][j].PCgN;
				mostDenseNode= somJson[i][j];
			} 
		}
	}
	return mostDenseNode;
}

function findLeastDenseNode(neurons){
	var leastDense = 1;
	var leastDenseNode;
	for(var i = 0; i < neurons.length; i++){
		for(var j = 0; j < neurons[i].length; j++){
			if(neurons[i][j].PCgN < leastDense){
				leastDense = neurons[i][j].PCgN;
				leastDenseNode= neurons[i][j];
			} 
		}
	}
	return leastDenseNode;
}

function initializeSOMNodes(som, size){
	
	if(size == 2){
		let labColor = RGBtoLAB(255,255,255);
		som.neurons[0][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,0,255);
		som.neurons[1][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,0,0);
		som.neurons[0][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(0,0,0);
		som.neurons[1][1].setWeights([labColor.l, labColor.a, labColor.b]);
	} else if (size == 3){
		let labColor = RGBtoLAB(255,255,255);
		som.neurons[0][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,127,255);
		som.neurons[1][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,0,255);
		som.neurons[2][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		
		labColor = RGBtoLAB(255,127,127);
		som.neurons[0][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(191,63,127);
		som.neurons[1][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(127,0,127);
		som.neurons[2][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		
		labColor = RGBtoLAB(255,0,0);
		som.neurons[0][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(127,0,0);
		som.neurons[1][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(0,0,0);
		som.neurons[2][2].setWeights([labColor.l, labColor.a, labColor.b]);
	} else if (size == 4){
		let labColor = RGBtoLAB(255,255,255);
		som.neurons[0][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,170,255);
		som.neurons[1][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,85,255);
		som.neurons[2][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,0,255);
		som.neurons[3][0].setWeights([labColor.l, labColor.a, labColor.b]);
		
		
		labColor = RGBtoLAB(255,170,170);
		som.neurons[0][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(223,96,160);
		som.neurons[1][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(191,64,160);
		som.neurons[2][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(170,0,170);
		som.neurons[3][1].setWeights([labColor.l, labColor.a, labColor.b]);
		

		labColor = RGBtoLAB(255,85,85);
		som.neurons[0][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(191,64,96);
		som.neurons[1][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(160,64,96);
		som.neurons[2][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(85,0,85);
		som.neurons[3][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		
		labColor = RGBtoLAB(255,0,0);
		som.neurons[0][3].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(170,0,0);
		som.neurons[1][3].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(85,0,0);
		som.neurons[2][3].setWeights([labColor.l, labColor.a, labColor.b]);

		labColor = RGBtoLAB(0,0,0);
		som.neurons[2][3].setWeights([labColor.l, labColor.a, labColor.b]);
	}
	
}

function bestOrientation(neurons, size){
	let initsom = new SOM(size,size,3);
	
	initializeSOMNodes(initsom, size);
	
	let bestDist = 9999999999999;
	let bestNeurons;
	
	for(let i = 0; i < 2; i++){
		for(let j = 0; j < 4; j++){
			let newNeurons = orientNeurons(neurons, j, i == 1);
			let dist = testDist(newNeurons, initsom.neurons);
			if(dist < bestDist){
				bestNeurons = newNeurons;
				bestDist = dist;
			}
		}
	}
	
	return bestNeurons;
	//rotate 0,1,2,3 and flip or no flip
}

function testDist(neurons1, neurons2){
	//calcDistance
	totalDist = 0;
	for(let i = 0; i < neurons1.length; i++){
		for(let j = 0; j < neurons1[i].length; j++){
			let thisDist = neurons1[i][j].calcDistance(neurons2[i][j].weights);
			//thisDist = thisDist * thisDist;
			totalDist += thisDist;
		}
	}
	return totalDist;
}

function orientNeurons(neurons, rotateTimes, flip){
	let newNeurons = neurons;
	for(i = 0; i < rotateTimes; i++){
		newNeurons = rotateNeurons(newNeurons);
	}
	if(flip){
		newNeurons = flipNeurons(newNeurons);
	}
	
	return newNeurons;
}

function rotateNeurons(neurons){
	//copy into new array
	let widthArray = [];
	for(let i = 0; i < neurons[0].length; i++){
		heightArray = [];
		for(let j = 0; j < neurons.length; j++){
			heightArray.push(neurons[j][neurons.length - i - 1]);
		}
		widthArray.push(heightArray);
	}
	
	return widthArray;
}

function flipNeurons(neurons){
	//copy into new array
	let widthArray = [];
	for(let i = 0; i < neurons.length; i++){
		heightArray = [];
		for(let j = 0; j < neurons[i].length; j++){
			heightArray.push(neurons[neurons.length - i - 1][j]);
		}
		widthArray.push(heightArray);
	}
	
	return widthArray
}



function RGBtoLAB(r,g,b){
	var labColor = d3.lab("rgb("+r+","+g+","+b+")");
	return labColor;
}
 
  

