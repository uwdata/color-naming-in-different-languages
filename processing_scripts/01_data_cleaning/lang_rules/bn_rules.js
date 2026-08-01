// Bulgarian (български език)

const excludeNames = [

];

const nameReplacingRules = [
    [/akashi/g, "আকাশি"],
    [/kamala/g, "কমলা"],

    [/কাল$/, "কালো"],
    [/kaalo/g, "কালো"],
    [/kalo/g, "কালো"],

    [/garo/g, "গাঢ"],
    [/gaarho/g, "গাঢ"],

    [/golapi/g, "গোলাপি"],
    [/golabi/g, "গোলাপি"],

    [/nil/g, "নীল"],
    [/neel/g, "নীল"],

    [/pink/g, "পিঙক"],

    [/badami/g, "বাদামি"],

    [/beguni/g, "বেগুনি"],

    [/lal/g, "লাল"],
    [/laal/g, "লাল"],

    [/sobuj/g, "সবুজ"],
    [/shobuj/g, "সবুজ"],
    [/shobooj/g, "সবুজ"],
    
    [/holud/g, "হলুদ"],

    [/halka/g, "হালকা"],

    [/magenda/g, "মেজেনটা"],
    [/magenta/g, "মেজেনটা"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}