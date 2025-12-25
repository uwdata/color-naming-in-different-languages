// English (English)


const forbiddenCharacters = /[^0-9a-zA-Z]/ig

const excludeNames = [
    // nonsense entries:
    "a", "c", "d", "w", "y", "b", "as", "asd", "asdf", "adsf", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];
const nameReplacingRules = [
    [/avacado/, "avocado"],

    [/^bage$/, "beige"],
    [/baige/, "beige"],
    [/biege/, "beige"],

    [/^blu$/, "blue"],
    [/^bluw$/, "blue"],
    [/^bue$/, "blue"],

    [/burgendy/, "burgundy"],
    [/burgandy/, "burgundy"],

    [/cerulian/, "cerulean"],

    [/chartruse/, "chartreuse"],
    [/chartruese/, "chartreuse"],
    [/charteuse/, "chartreuse"],
    [/chartruce/, "chartreuse"],
    [/chatreuse/, "chartreuse"],

    [/colbalt/, "cobalt"],
    [/cobolt blue/, "cobaltblue"],

    [/^cian$/, 'cyan'],
    

    [/forrest/, "forest"],

    [/fusha/, "fuchsia"],
    [/fuchia/, "fuchsia"],
    [/fucsia/, "fuchsia"],
    [/fusia/, "fuchsia"],
    [/fushia/, "fuchsia"],
    [/fuschia/, "fuchsia"],
    [/fuscia/, "fuchsia"],
    [/fuscia/, "fuchsia"],
    [/fascia/, "fuchsia"],
    [/fucia/, "fuchsia"],
    [/fucia/, "fuchsia"],
    [/fucshia/, "fuchsia"],
    [/fuscha/, "fuchsia"],
    [/fuschsia/, "fuchsia"],
    [/fushchia/, "fuchsia"],
    [/fushcia/, "fuchsia"],
    [/fusica/, "fuchsia"],
    
    [/grey/, "gray"],

    [/^geen$/, "green"],
    [/^grean$/, "green"],
    [/^gree$/, "green"],
    [/^greeb$/, "green"],
    [/^greeen$/, "green"],
    [/^gren$/, "green"],
    [/^grren$/, "green"],
    [/^gteen$/, "green"],


    [/lavendar/, "lavender"],
    [/lavander/, "lavender"],
    [/lavender/, "lavender"],
    [/lavender/, "lavender"],

    [/^linegreen/, "limegreen"],
    [/majenta/, "magenta"],

    [/marron/, "maroon"],
    [/marroon/, "maroon"],

    [/muave/, "mauve"],

    [/indago/, "indigo"],
    [/indego/, "indigo"],
    [/indgo/, "indigo"],

    [/i dont know/, "idk"], 
    [/i don't know/, "idk"],
    [/dont know/, "idk"],
    
    [/kahki/, "khaki"],
    [/kaki/, "khaki"],

    [/light gree$/, "light green"],

    [/magentia/, "magenta"],
    [/magento/, "magenta"],
    [/magnenta/, "magenta"],
    [/magneta/, "magenta"],
    [/mangenta/, "magenta"],
    [/megenta/, "magenta"],
    
    [/mahagony/, "mahogany"],

    [/maron$/, "maroon"],
    [/maroom/, "maroon"],
    [/maroone/, "maroon"],

    [/^ocre$/, "ochre"],

    [/^orage$/, "orange"],
    [/^oragne$/, "orange"],
    [/^orance$/, "orange"],
    [/^orane$/, "orange"],
    [/^orang$/, "orange"],
    [/^orangw$/, "orange"],
    [/^organe$/, "orange"],
    [/^organge$/, "orange"],
    [/^ornage$/, "orange"],

    [/perrywinkle/, "periwinkle"],
    [/perriwinkle/, "periwinkle"],

    [/^pank$/, "pink"],
    [/^pinl$/, "pink"],

    [/puple/, "purple"],
    [/pruple/, "purple"],
    [/^pirple$/, "purple"],
    [/^pueple$/, "purple"],
    [/purpel/, "purple"],
    [/purpl$/, "purple"],
    [/purplr/, "purple"],
    [/putple/, "purple"],

    [/^puse$/, "puce"],


    [/^ref$/, "red"],
    [/^res$/, "red"],

    [/redish/, "reddish"],

    [/robinsegg/, "robinegg"],

    [/royal blye/, "royal blue"],
    
    [/scarlett/, "scarlet"],

    [/siena/, "sienna"],

    [/^teel$/, "teal"],
    [/^teil$/, "teal"],

    [/terracota/, "terracotta"],

    [/turquise/, "turquoise"],
    [/turqouise/, "turquoise"],
    [/turquise/, "turquoise"],
    [/turquiose/, "turquoise"],
    [/torquoise/, "turquoise"],
    [/turqoise/, "turquoise"],
    [/terquoise/, "turquoise"],
    [/torquise/, "turquoise"],
    [/torquois$/, "turquoise"],
    [/torquose/, "turquoise"],
    [/tourquise/, "turquoise"],
    [/tourquoise/, "turquoise"],
    [/tuqoise/, "turquoise"],
    [/tuquoise/, "turquoise"],
    [/turcoise/, "turquoise"],
    [/turqouis/, "turquoise"],
    [/turquois$/, "turquoise"],
    [/turquoises/, "turquoise"],
    
    [/viloet/, "viloet"],
    

    [/yello$/, "yellow"],
    [/yelloe/, "yellow"],
    [/yelloq/, "yellow"]
];

export default {
    forbiddenCharacters: forbiddenCharacters,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}