const BIN_SIZE = 10;
const MIN_L = 0,
      MIN_A = -84.89223876091079,
      MIN_B = -112.02942991288025,
      MAX_L = 100,
      MAX_A = 93.55002493980824,
      MAX_B = 93.38847788323793;

  

function getLAB(bin_l, bin_a, bin_b, binSize = BIN_SIZE){
  let offsetBinA = Math.floor(MIN_A/binSize);
  let offsetBinB = Math.floor(MIN_B/binSize);
  return [bin_l * binSize, (bin_a + offsetBinA) * binSize, (bin_b + offsetBinB) * binSize];
}

function getLABBinNum(l, a, b, binSize = BIN_SIZE){
  let offsetBinA = Math.floor(MIN_A/binSize);
  let offsetBinB = Math.floor(MIN_B/binSize);
  let [bin_l, bin_a, bin_b] = [Math.floor(l / binSize), Math.floor(a / binSize), Math.floor(b / binSize)];
  if ((bin_a - offsetBinA < 0) || (bin_b - offsetBinB) < 0) {
    console.log("WARNING!", l,a,b);
  }
  return [bin_l, bin_a - offsetBinA, bin_b - offsetBinB];
}
function createLABBinN(binSize){
  let nL = Math.floor(MAX_L/binSize)+1;
  let nA = Math.floor(MAX_A/binSize) - Math.floor(MIN_A/binSize) + 1;
  let nB = Math.floor(MAX_B/binSize) - Math.floor(MIN_B/binSize) + 1;
  return [nL, nA, nB];
}
function createLABBins(binSize){
  let nL = Math.floor(MAX_L/binSize)+1;
  let nA = Math.floor(MAX_A/binSize) - Math.floor(MIN_A/binSize) + 1;
  let nB = Math.floor(MAX_B/binSize) - Math.floor(MIN_B/binSize) + 1;
  let arr = new Array(nL).fill(0);
  arr = arr.map(d => {
    let arrA = new Array(nA).fill(0);
    return arrA.map(a => new Array(nB).fill(0));
  });
  return arr;
}

module.exports = {
  "getLAB": getLAB,
  "getLABBinNum": getLABBinNum,
  "createLABBinN": createLABBinN,
  "createLABBins": createLABBins
};