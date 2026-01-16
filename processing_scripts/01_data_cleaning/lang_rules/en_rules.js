// English (English)


const ignoreCharactersForMatching = /[^0-9a-zA-Z]/ig

const excludeNames = [
    // nonsense entries:
    "a", "c", "d", "w", "y", "b", "as", "asd", "asdf", "adsf", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];
const nameReplacingRules = [
    [/avacado/g, "avocado"],

    [/^bage$/, "beige"],
    [/baige/g, "beige"],
    [/biege/g, "beige"],

    [/^blu$/, "blue"],
    [/^bluw$/, "blue"],
    [/^bue$/, "blue"],

    [/burgendy/g, "burgundy"],
    [/burgandy/g, "burgundy"],

    [/cerulian/g, "cerulean"],

    [/chartruse/g, "chartreuse"],
    [/chartruese/g, "chartreuse"],
    [/charteuse/g, "chartreuse"],
    [/chartruce/g, "chartreuse"],
    [/chatreuse/g, "chartreuse"],

    [/colbalt/g, "cobalt"],
    [/cobolt blue/g, "cobaltblue"],

    [/^cian$/, 'cyan'],
    

    [/forrest/g, "forest"],

    [/fusha/g, "fuchsia"],
    [/fuchia/g, "fuchsia"],
    [/fucsia/g, "fuchsia"],
    [/fusia/g, "fuchsia"],
    [/fushia/g, "fuchsia"],
    [/fuschia/g, "fuchsia"],
    [/fuscia/g, "fuchsia"],
    [/fuscia/g, "fuchsia"],
    [/fascia/g, "fuchsia"],
    [/fucia/g, "fuchsia"],
    [/fucia/g, "fuchsia"],
    [/fucshia/g, "fuchsia"],
    [/fuscha/g, "fuchsia"],
    [/fuschsia/g, "fuchsia"],
    [/fushchia/g, "fuchsia"],
    [/fushcia/g, "fuchsia"],
    [/fusica/g, "fuchsia"],
    
    [/grey/g, "gray"],

    [/^geen$/, "green"],
    [/^grean$/, "green"],
    [/^gree$/, "green"],
    [/^greeb$/, "green"],
    [/^greeen$/, "green"],
    [/^gren$/, "green"],
    [/^grren$/, "green"],
    [/^gteen$/, "green"],


    [/lavendar/g, "lavender"],
    [/lavander/g, "lavender"],
    [/lavender/g, "lavender"],
    [/lavender/g, "lavender"],

    [/^linegreen/, "limegreen"],
    [/majenta/g, "magenta"],

    [/marron/g, "maroon"],
    [/marroon/g, "maroon"],

    [/muave/g, "mauve"],

    [/indago/g, "indigo"],
    [/indego/g, "indigo"],
    [/indgo/g, "indigo"],

    [/i dont know/g, "idk"], 
    [/i don't know/g, "idk"],
    [/dont know/g, "idk"],
    
    [/kahki/g, "khaki"],
    [/kaki/g, "khaki"],

    [/light gree$/, "light green"],

    [/magentia/g, "magenta"],
    [/magento/g, "magenta"],
    [/magnenta/g, "magenta"],
    [/magneta/g, "magenta"],
    [/mangenta/g, "magenta"],
    [/megenta/g, "magenta"],
    
    [/mahagony/g, "mahogany"],

    [/maron$/, "maroon"],
    [/maroom/g, "maroon"],
    [/maroone/g, "maroon"],

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

    [/perrywinkle/g, "periwinkle"],
    [/perriwinkle/g, "periwinkle"],

    [/^pank$/, "pink"],
    [/^pinl$/, "pink"],

    [/puple/g, "purple"],
    [/pruple/g, "purple"],
    [/^pirple$/, "purple"],
    [/^pueple$/, "purple"],
    [/purpel/g, "purple"],
    [/purpl$/, "purple"],
    [/purplr/g, "purple"],
    [/putple/g, "purple"],

    [/^puse$/, "puce"],


    [/^ref$/, "red"],
    [/^res$/, "red"],

    [/redish/g, "reddish"],

    [/robinsegg/g, "robinegg"],

    [/royal blye/g, "royal blue"],
    
    [/scarlett/g, "scarlet"],

    [/siena/g, "sienna"],

    [/^teel$/, "teal"],
    [/^teil$/, "teal"],

    [/terracota/g, "terracotta"],

    [/turquise/g, "turquoise"],
    [/turqouise/g, "turquoise"],
    [/turquise/g, "turquoise"],
    [/turquiose/g, "turquoise"],
    [/torquoise/g, "turquoise"],
    [/turqoise/g, "turquoise"],
    [/terquoise/g, "turquoise"],
    [/torquise/g, "turquoise"],
    [/torquois$/, "turquoise"],
    [/torquose/g, "turquoise"],
    [/tourquise/g, "turquoise"],
    [/tourquoise/g, "turquoise"],
    [/tuqoise/g, "turquoise"],
    [/tuquoise/g, "turquoise"],
    [/turcoise/g, "turquoise"],
    [/turqouis/g, "turquoise"],
    [/turquois$/, "turquoise"],
    [/turquoises/g, "turquoise"],
    
    [/viloet/g, "viloet"],
    

    [/yello$/, "yellow"],
    [/yelloe/g, "yellow"],
    [/yelloq/g, "yellow"]
];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}