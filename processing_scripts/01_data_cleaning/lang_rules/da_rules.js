// Danish (dansk)

const excludeNames = [
    // English color names:
    "blue", "green", "red", "teal", "darkorange", "light blue", "lightblue",  "light green", "lightgreen", "lime green", "limegreen", "pinkl",  "purple", "yellow", "hot pink", "turqouise", "turquoise", "dark blue", "darkorange", "curry yellow", "curryyellow" 
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