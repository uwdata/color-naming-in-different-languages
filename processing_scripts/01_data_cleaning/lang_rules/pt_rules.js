// Portuguese (português)

const excludeNames = [
    // English color names:
    "blue","pink","green","red","orange","yellow","light blue","purple","turquoise","lighter blue","purpel","dark pink","dark yellow","bright green","sea blue","bright pink","light red","gold","yeallow" 
];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [
    [/azul maringo/, "azul marinho"], 
    [/fucsia/, "fúcsia"], 
    [/laranja escuto/, "laranja escuro"], 
    [/lilas/, "lilás"], 
    [/limao/, "limão"],
    [/purpura/, "púrpura"], 
    [/rosa chock$/, "rosa choque"], 
    [/turqueza/, "turquesa"], 
    [/^verdeado/, "esverdeado"], 
    [/verde mar$/, "verde marinho"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}