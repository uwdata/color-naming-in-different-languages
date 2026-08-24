// Hindi (हिन्दी, हिंदी)

const excludeNames = [
    // English color names:
    "blue", "brown", "green", "grey", "pink", "purple", "black", "sky blue", "violet", "maroon"
];

const nameReplacingRules = [
    [/aakash/g, "आकाश"],
    [/akash/g, "आकाश"],

    [/aasmaani/g, "आसमानी"],
    [/aasmani/g, "आसमानी"],
    [/aasamni/g, "आसमानी"],
    [/asmani/g, "आसमानी"],

    [/kala/g, "काला"],
    [/kaala/g, "काला"],

    [/gehra/g, "गहरा"],
    [/ghera/g, "गहरा"],
    [/gahra/g, "गहरा"],
    [/ghra/g, "गहरा"],
    [/gehara/, "गहरा"],
    [/gehr/, "गहरा"],

    [/gulabi\./, "गुलाबी"],
    [/gulabi/, "गुलाबी"],
    [/gulaabi/, "गुलाबी"],
    [/gulab/, "गुलाबी"],

    [/neela/, "नीला"],
    [/nila/, "नीला"],
    [/nela/, "नीला"],

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
    [/baegaini/, "बैंगनी"],

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
    [/raani/, "रानी"],

    [/gadha/, "गाढ़ा"],
    [/gada/, "गाढ़ा"],
    [/gaadha/, "गाढ़ा"],

    [/santra/, "संतरा"],
    [/santari/, "संतरा"],
    
    [/pista/, "पिस्ता"],

    [/chamkila/, "चमकीला"],

    [/firozi/, "फिरोजी"],
    [/firosi/, "फिरोजी"],
    [/ferozi/, "फिरोजी"],

    [/samudri/, "समुद्री"],

    [/तोता/, "तोतई"],
    [/tootiya/, "तोतई"],
    [/totaiya/, "तोतई"],
    [/totayi/, "तोतई"],
    [/totiya/, "तोतई"],
    [/totia/, "तोतई"],
    [/tota/, "तोतई"],

    [/feeka/, "फीका"]

];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}