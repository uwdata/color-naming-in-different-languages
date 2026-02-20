// Portuguese (português)

const excludeNames = [
    // English color names:
    "blue","pink","green","red","orange","yellow","light blue","purple","turquoise","lighter blue","purpel","dark pink","dark yellow","bright green","sea blue","bright pink","light red","gold","yeallow" 
];

const nameReplacingRules = [
    [/azul maringo/, "azul marinho"], 
    [/fucsia/, "fúcsia"], 
    [/florescente/, "fluorescente"],
    [/laranha/, "laranja"],
    [/laranja escuto/, "laranja escuro"], 

    [/lilaz/, "lilas"],
    [/lilas/, "lilás"], 

    [/limao/, "limão"],

    [/magennta/, "magenta"],
    [/mangenta/, "magenta"],

    [/marron/, "marrom"],

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