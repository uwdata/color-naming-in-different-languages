// Arabic (العربية),وردي,وردي,وردي

const ignoreCharactersForMatching = /[^\u0600-\u06FF]/ig

const keepSpaces = true

const excludeNames = [

];

const nameReplacingRules = [
    [/احمر/, "أحمر"], 
    [/اخضر/, "أخضر"], 
    [/ازرق/, "أزرق"], 
    [/ازرقفاتح/, "أزرقفاتح"], 
    [/اصفر/, "أصفر"], 
    [/فوشي/, "فوشي"], 
    [/فوشيا/, "فوشي"]
];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules,
    keepSpaces: keepSpaces
}