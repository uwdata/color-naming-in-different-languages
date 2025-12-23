// Danish (dansk)

const excludeNames = [
    // English color names:
    "blue", "green", "red", "teal", "darkorange",  "lightblue",  "lightgreen", "limegreen", "pinkl",  "purple", "yellow", "hot pink", "turqouise", "turquoise", "dark blue", "darkorange", "curryyellow" 
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