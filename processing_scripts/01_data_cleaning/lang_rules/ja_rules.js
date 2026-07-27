// Todo: Use this library
// https://www.npmjs.com/package/kuroshiro

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

const kuroshiro = new Kuroshiro();

await kuroshiro.init(new KuromojiAnalyzer());


const convertScript = async (str) => {
    return await kuroshiro.convert(str, {to: "hiragana"})
}

const removedEnds = ["いろ", "しょく", "色"]

const excludeNames = [
];

const nameReplacingRules = [
    [/kimidori/, "きみとり"]
];

export default {
    removedEnds: removedEnds,
    excludeNames: excludeNames,
    convertScript: convertScript,
    nameReplacingRules: nameReplacingRules
}