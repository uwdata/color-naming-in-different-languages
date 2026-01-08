// Arabic (العربية),وردي,وردي,وردي

const ignoreCharactersForMatching = /[^\u0600-\u06FF\s ]/ig

const keepSpaces = true

const excludeNames = [

];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [
    [/احمر/, "أحمر"], 
    [/اخضر/, "أخضر"], 
    [/ازرق/, "ازرق"], 
    [/ازرقفاتح/, "ازرقفاتح"], 
    [/اصفر/, "أصفر"], 
    [/فوشي/, "فوشي"], 
    [/فوشيا/, "فوشي"]
];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules,
    keepSpaces: keepSpaces
}