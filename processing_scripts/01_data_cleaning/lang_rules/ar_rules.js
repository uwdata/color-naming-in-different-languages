// Arabic (العربية),وردي,وردي,وردي

const forbiddenCharacters = /[^\u0600-\u06FF]/ig

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
    forbiddenCharacters: forbiddenCharacters,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}