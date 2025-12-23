// Spanish (español)

const excludeNames = [
    // nonsense entries:
    "a", "w", "y", "b", "asdf"
];
const nameReplacingRules = [
    [/avacado/, "avocado"],
    [/biege/, "beige"],

    [/burgendy/, "burgundy"],
    [/burgandy/, "burgundy"],

    [/chartruse/, "chartreuse"],
    [/chartruese/, "chartreuse"],

    [/forrest/, "forest"],

    [/fusha/, "fuchsia"],
    [/fuchia/, "fuchsia"],
    [/fucsia/, "fuchsia"],
    [/fusia/, "fuchsia"],
    [/fushia/, "fuchsia"],
    [/fuschia/, "fuchsia"],
    [/fuscia/, "fuchsia"],
    [/fuscia/, "fuchsia"],

    [/grey/, "gray"],

    [/lavendar/, "lavender"],
    [/lavander/, "lavender"],
    [/lavender/, "lavender"],
    [/lavender/, "lavender"],

    [/linegreen/, "limegreen"],
    [/majenta/, "magenta"],

    [/marron/, "maroon"],
    [/marroon/, "maroon"],

    [/muave/, "mauve"],

    [/perrywinkle/, "periwinkle"],
    [/perriwinkle/, "periwinkle"],

    [/puple/, "purple"],
    [/pruple/, "purple"],

    [/robinseggblue/, "robineggblue"],
    [/scarlett/, "scarlet"],

    [/turquise/, "turquoise"],
    [/turqouise/, "turquoise"],
    [/turquise/, "turquoise"],
    [/turquiose/, "turquoise"],
    [/torquoise/, "turquoise"],
    [/turqoise/, "turquoise"],
    
    [/yello$/, "yellow"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}