// Korean (한국어, 조선어)

const standardizedEnds = ["색"]

const forbiddenCharacters = /[a-zA-Z]/

const excludeNames = [
];

const nameReplacingRules = [
    [/파란/, "파랑"],
    [/노란/, "노랑"],
    [/빨간/, "빨강"],
    [/검은/, "검정"],
    [/연한/, "연"],
    [/진한/, "진"],
    [/청녹/, "청록"]
];


export default {
    standardizedEnds: standardizedEnds,
    forbiddenCharacters: forbiddenCharacters,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}