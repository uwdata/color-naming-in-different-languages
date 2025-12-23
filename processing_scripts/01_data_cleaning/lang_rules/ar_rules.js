// Arabic (العربية),وردي,وردي,وردي

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
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}