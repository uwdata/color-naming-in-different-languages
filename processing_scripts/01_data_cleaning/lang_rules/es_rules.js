// Spanish (español)

const excludeNames = [
    // English color names:
    "blue", "orange", "pink", "green","purple","yellow","red", "light blue", "dark blue", "teal" 
];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [
    [/acuamarina/, "aguamarina"],
    [/cian/, "cyan"], 
    [/fuxia/, "fucsia"], 
    [/limon/, "limón"], 
    [/rosado/, "rosa"], 
    [/purpura/, "púrpura"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}