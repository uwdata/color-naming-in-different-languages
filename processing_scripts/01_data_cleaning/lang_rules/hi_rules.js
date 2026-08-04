// Hindi (हिन्दी, हिंदी)

const excludeNames = [
    // English color names:
    "blue", "brown", "green", "grey", "pink", "purple"
];

const nameReplacingRules = [
    [/aasmaani/g, "आसमानी"],
    [/aasmani/g, "आसमानी"],

    [/kala/g, "काला"],
    [/kaala/g, "काला"],

    [/gehra/g, "गहरा"],
    [/ghera/g, "गहरा"],
    [/gahra/g, "गहरा"],

    [/gulabi/, "गुलाबी"],
    [/gulaabi/, "गुलाबी"],

    [/neela/, "नीला"],
    [/nila/, "नीला"],

    [/narangi/, "नारंगी"],
    [/narangee/, "नारंगी"],
    [/naarangi/, "नारंगी"],
    [/naaranji/, "नारंगी"],

    [/neel/, "नील"],

    [/peela/, "पीला"],
    [/pila/, "पीला"],
    [/pilla/, "पीला"],


    [/baingani/, "बैंगनी"],
    [/baingni/, "बैंगनी"],
    [/bangani/, "बैंगनी"],
    [/bengane/, "बैंगनी"],
    [/bengani/, "बैंगनी"],
    [/bagani/, "बैंगनी"],
    [/baigani/, "बैंगनी"],

    [/bhura/, "भूरा"],
    [/bhoora/, "भूरा"],
    [/bhurra/, "भूरा"],

    [/lal/, "लाल"],
    [/laal/, "लाल"],

    [/saleti/, "सलेटी"],

    [/hara/, "हरा"],
    [/haara/, "हरा"],

    [/halka/, "हल्का"],

    [/kai/, "काई"],

    [/magenta/, "मैजेंटा"],
    [/magentaa/, "मैजेंटा"],
    [/majenta/, "मैजेंटा"],

    [/jamuni/, "जामुनी"],
    [/jamani/, "जामुनी"],

    [/rani/, "रानी"],

    [/gadha/, "गाढ़ा"],
    [/gada/, "गाढ़ा"],
    [/gaadha/, "गाढ़ा"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}