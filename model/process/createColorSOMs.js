var SOM = require('./SOM');

const fs = require('fs'),
  d3 = require('d3'),
  csv=require("csvtojson");;
  
csv().fromFile("../cleaned_fullRGB_color_names.csv")
  .then((namingData)=>{
    console.log(namingData[0]);
	createSOMs(namingData);
  });
 

function createSOMs(namingData){
	var translationFile = fs.readFileSync("../translation_loss/translation_loss_en_ko.json");
	// Define to JSON type
	var translations = JSON.parse(translationFile);
	let colorNames = {};
	colorNames.en = [];
	colorNames.ko = [];
	for(i in translations){
		colorNames.en.push(translations[i].enterm);
		colorNames.ko.push(translations[i].koterm);
	}	
	
	translationFile = fs.readFileSync("../translation_loss/translation_loss_fa_ko.json");
	// Define to JSON type
	translations = JSON.parse(translationFile);
	colorNames.fa = [];
	for(i in translations){
		colorNames.fa.push(translations[i].faterm);
		colorNames.ko.push(translations[i].koterm);
	}	
	
	translationFile = fs.readFileSync("../translation_loss/translation_loss_fa_zh.json");
	// Define to JSON type
	translations = JSON.parse(translationFile);
	colorNames.zh = [];
	for(i in translations){
		colorNames.fa.push(translations[i].faterm);
		colorNames.zh.push(translations[i].zhterm);
	}	
	
	translationFile = fs.readFileSync("../translation_loss/translation_loss_en_en.json");
	// Define to JSON type
	translations = JSON.parse(translationFile);
	colorNames.en = [];
	for(i in translations){
		colorNames.en.push(translations[i].enterm);
		colorNames.en.push(translations[i].enterm2);
	}	
	
	console.log(colorNames.en.length);
	
	colorNames.en = [...new Set(colorNames.en)]; // get distinct
	colorNames.ko = [...new Set(colorNames.ko)]; // get distinct
	colorNames.fa = [...new Set(colorNames.fa)]; // get distinct
	colorNames.zh = [...new Set(colorNames.zh)]; // get distinct
	
	console.log(colorNames.en.length);
	
	//let colorNames = ["연두", "초록", "green", "armygreen", "mint", "blue", "하늘", "파랑", "aqua", "cyan", "red", "magenta", "purple", "pink", "white", "cream", "black", "gray", "pastel", "neon"];
	
	outputJSON = {};
	let languages = ["fa", "zh", "en", "ko"];
	for(var i in languages){
		let lang = languages[i];
		outputJSON[lang] = {};
		for(var i in colorNames[lang]){
			let colorName = colorNames[lang][i];
			
			let thisColorData = namingData.filter(function(item){return item.name == colorName;});
			console.log(thisColorData.length);
			if(thisColorData.length == 0){
				console.log("Color name had no data", colorName, lang, i);
				continue
			}
			
			var LABdata = [];
			for(var j in thisColorData){
				labColor = RGBtoLAB(thisColorData[j].r,thisColorData[j].g,thisColorData[j].b);
				LABdata.push([labColor.l, labColor.a, labColor.b]);
			}
			
			LABdata.sort(function() {
			  return .5 - Math.random();
			});
			
			
			let thisColorInfo = {};
			console.log("color:", colorName);
			
			thisColorInfo["numRecords"] = thisColorData.length;
			thisColorInfo["colorNodes4"] = createSOM(colorName, LABdata, 2);
			thisColorInfo["colorNodes4Excluded"] = findSOMExcludedAmount(thisColorInfo["colorNodes4"]);
			
			thisColorInfo["colorNodes9"] = createSOM(colorName, LABdata, 3);
			thisColorInfo["colorNodes9Excluded"] = findSOMExcludedAmount(thisColorInfo["colorNodes9"]);
			
			let representativeColor;
			if(thisColorData.length > 18){
				representativeColor = findMostDenseNode(thisColorInfo["colorNodes9"]).rgb;
			} else {
				representativeColor = findMostDenseNode(thisColorInfo["colorNodes4"]).rgb;
			}
			thisColorInfo["representativeColor"] = representativeColor;
			
			outputJSON[lang][colorName] = thisColorInfo;

			
		}
	}
	fs.writeFileSync("../colorSOM.json", JSON.stringify(outputJSON));
}	
 
function createSOM(colorName, LABdata, size){


	

	
	
	let minNeighborhoodSize = 1.5;
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
		
		som.train(LABdata, 10000, minNeighborhoodSize);
		
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
		
		labColor = RGBtoLAB(223,96,127);
		som.neurons[1][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(255,127,255);
		som.neurons[2][1].setWeights([labColor.l, labColor.a, labColor.b]);
		
		
		labColor = RGBtoLAB(255,0,0);
		som.neurons[0][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(127,0,0);
		som.neurons[1][2].setWeights([labColor.l, labColor.a, labColor.b]);
		
		labColor = RGBtoLAB(0,0,0);
		som.neurons[2][2].setWeights([labColor.l, labColor.a, labColor.b]);
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
	newNeurons = neurons;
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
 
  

