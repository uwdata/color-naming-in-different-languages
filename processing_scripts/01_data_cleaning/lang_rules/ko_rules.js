// Korean (한국어, 조선어)

const standardizedEnd = "색"

const ignoreCharactersForMatching = /[a-zA-Z]/ig

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
    standardizedEnd: standardizedEnd,
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}