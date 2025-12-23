// Swedish (svenska)

const excludeNames = [
    // English color names:
    "blue", "magenta", "cyan","green", "pink", "purple"
];
const nameReplacingRules = [
    [/grøm/, "grøn"],
    [/lille/, "lilla"],
    [/tyrkis/, "turkis"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}