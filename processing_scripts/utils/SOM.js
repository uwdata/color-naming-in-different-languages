//Code for Self-Organizing Maps

// if a datapoint has an extra value, it is an adjustment value
function adjustValue(dims, newData, value){
	if(newData.length > dims) { 
		return value * newData[dims]
	}
	return value
}

//constructor for Neuron
function neuron(dims) {
	//properties
	this.weights = new Array(dims);
	this.coordinates = {}; //x and y coordinates of neuron
	
	//fill in properties
	for(var i = 0; i < this.weights.length; i++){
		this.weights[i] = 0;
	}
	
	//methods
	this.setWeights = function(newWeights){
		this.updateWeights(newWeights, 1);
	};
	
	this.updateWeights = function(newWeights, fraction){
		// if extra value on new weight, it is an optional weight correction
		fraction = adjustValue(this.weights.length, newWeights, fraction)
		for(var i = 0; i < this.weights.length; i++){
			this.weights[i] = this.weights[i] * (1-fraction) + newWeights[i]*fraction;
		}
	};
	
	this.calcDistance = function(testWeights){
		var distsq = 0;
		for(var i = 0; i < this.weights.length; i++){
			var temp = this.weights[i] - testWeights[i];
			distsq += temp * temp;
		}
		var dist = Math.sqrt(distsq);
		return dist;
	};
}

function som(width, height, dims) {
	//properties
	this.dims = dims;
	this.neurons = new Array(width);
	
	//fill in properties
	//create neurons
	for(var i = 0; i < width; i++){
		this.neurons[i] = [];
		for(var j = 0; j < height; j++){
			let newNeuron = new neuron(dims);
			newNeuron.coordinates.x = i;
			newNeuron.coordinates.y = j;
			this.neurons[i].push(newNeuron);
			
		}
	}
	
	this.setNodeWeights = function(weightsArrays){
		for(let i = 0; i < this.neurons.length; i++){
			for(let j = 0; j < this.neurons[0].length; j++){
				this.neurons[i][j].setWeights(weightsArrays[i][j]);
			}
		}
	}
	
	this.findBMU = function(testWeights) {
		var bestDist;
		var bestNueronCoords;
		for(var i = 0; i < this.neurons.length; i++){
			for(var j = 0; j < this.neurons[i].length; j++){
				var currentDist = this.neurons[i][j].calcDistance(testWeights);
				if( typeof bestDist === "undefined" || currentDist < bestDist){
					bestDist = currentDist;
					bestNueronCoords = {x: i, y: j};
				}
			}
		}
		return bestNueronCoords;
	};
	
	// Finds all neurons at a distance "dist" from the location "centerLocation". Neurons
	// that are either closer or further are ignored.
	this.findNeighborhoodRing = function(centerLocation, dist){
		var width = this.neurons.length;
		var height = this.neurons[0].length;
		var xCoords = [centerLocation.x - dist, centerLocation.x + dist];
		var yCoords = [centerLocation.y - dist, centerLocation.y + dist];
		var coordsLength = 2;
		if(dist == 0){
			coordsLength = 1;
		}
		
		var neurons = [];
		//top / bottom
		for(var x = xCoords[0]; x <= xCoords[1]; x++){
			for(var j = 0; j < coordsLength; j++){
				var y = yCoords[j];
				if(x >= 0 && x < width && y >= 0 && y < height){
					neurons.push(this.neurons[x][y]);
				}
			}
		}
		
		//left / right (leaving out the corners that were part of top/bottom)
		for(var y = yCoords[0] + 1; y <= yCoords[1] - 1; y++){
			for(var j = 0; j < coordsLength; j++){
				var x = xCoords[j];
				if(x >= 0 && x < width && y >= 0 && y < height){
					neurons.push(this.neurons[x][y]);
				}
			}
		}

		return neurons;
	};
	
	this.findImmediateNeighbors = function(centerLocation){
		let neurons = [];
		
		let x = centerLocation.x +1;
		let y = centerLocation.y;
		if(x >= 0 && x < width && y >= 0 && y < height){
			neurons.push(this.neurons[x][y]);
		}
		
		x = centerLocation.x - 1;
		y = centerLocation.y;
		if(x >= 0 && x < width && y >= 0 && y < height){
			neurons.push(this.neurons[x][y]);
		}
		
		x = centerLocation.x;
		y = centerLocation.y + 1;
		if(x >= 0 && x < width && y >= 0 && y < height){
			neurons.push(this.neurons[x][y]);
		}
		
		x = centerLocation.x;
		y = centerLocation.y - 1;
		if(x >= 0 && x < width && y >= 0 && y < height){
			neurons.push(this.neurons[x][y]);
		}
		
		return neurons;
	};
	
	this.train = function(trainWeights, iterations, optionalMinNeighborhoodSize){
		var minNeighborhoodSize = 1.2;
		
		if(optionalMinNeighborhoodSize){
			minNeighborhoodSize = optionalMinNeighborhoodSize;
		}
		
		//initialize neurons to trainWeights
		var width = this.neurons.length;
		var height = this.neurons[0].length;
		for(var i = 0; i < width; i++){
			for(var j = 0; j < height; j++){
				var index = i * width + height;
				this.neurons[i][j].setWeights(trainWeights[index % trainWeights.length]);
			}
		}
		
		
		var maxNeighborhoodSize = Math.max(this.neurons.length, this.neurons[0].length) / 1;

		var neighborConst = Math.log(maxNeighborhoodSize / minNeighborhoodSize) / Math.log(2);
		
		//go through data in order (assume it was randomized first)
		for(var i = 0; i < iterations; i++){
			var neighborhoodSize = (maxNeighborhoodSize * Math.pow(2, -i * neighborConst / iterations)); 
			var iterationFraction = i * 1.0 / iterations;
			this.somTrainStep(trainWeights[i % trainWeights.length], neighborhoodSize, iterationFraction);
		}
	};
        
    this.somTrainStep = function(trainWeight, neighborhoodSize, iterationFraction){
		var bmuCoords = this.findBMU(trainWeight);
		for(var i = 0; i < neighborhoodSize; i++){
			var neighborNodes = this.findNeighborhoodRing(bmuCoords, i);
            for(var nodeIndex in neighborNodes) {
				let node = neighborNodes[nodeIndex]
				nodeDist = Math.sqrt(Math.pow(node.coordinates.x - bmuCoords.x, 2) + Math.pow(node.coordinates.y - bmuCoords.y, 2));
				var alpha = (.5*Math.pow(2, - iterationFraction *6.0 ) * Math.pow(2, - nodeDist*nodeDist / neighborhoodSize / neighborhoodSize));
                node.updateWeights(trainWeight, alpha)
			}
		}
	}
	
	this.findMaxNeighborDist = function(){
		let maxDist = -1;
		//find maxDistance between any two neighbor nodes
		for(var i = 0; i < this.neurons.length; i++){
			for(var j = 0; j < this.neurons[i].length; j++){
				let neighbors = this.findImmediateNeighbors({x: i, y: j});
				for(var k = 0; k < neighbors.length; k++){
					let dist = this.neurons[i][j].calcDistance(neighbors[k].weights);
					if(dist > maxDist){
						maxDist = dist;
					}
				}
			}
		}			
		return maxDist;
	}
	
	this.findDensity = function(datasetWeights, densityName, limit_range){
		let maxRange = -1;
		if(limit_range){
			//find maxDistance between any two neighbor nodes
			maxRange = this.findMaxNeighborDist() / 2;		
		}
		//initialize density to 0
		for(var i = 0; i < this.neurons.length; i++){
			for(var j = 0; j < this.neurons[i].length; j++){
				this.neurons[i][j][densityName] = 0;
			}
		}
		
		let adjustedDatasetLength = 0;
		let numExcluded = 0;
		for(var i = 0; i < datasetWeights.length; i++){
			adjustedDatasetLength += adjustValue(this.dims, datasetWeights[i], 1);
			var bmuCoords = this.findBMU(datasetWeights[i]);
			if(limit_range && this.neurons[bmuCoords.x][bmuCoords.y].calcDistance(datasetWeights[i]) > maxRange){
				numExcluded += adjustValue(this.dims, datasetWeights[i], 1);
			} else{
				this.neurons[bmuCoords.x][bmuCoords.y][densityName] += adjustValue(this.dims, datasetWeights[i], 1);;
			}
		}
		
		for(var i = 0; i < this.neurons.length; i++){
			for(var j = 0; j < this.neurons[i].length; j++){
				this.neurons[i][j][densityName] /= adjustedDatasetLength;
			}
		}
		
		
		return numExcluded;
	}
	
	
}

try{ // make work in nodejs or in browser
	module.exports = som;
} catch(e){
	
}
