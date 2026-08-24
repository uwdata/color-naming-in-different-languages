// Bulgarian (български език)

const excludeNames = [

];

const nameReplacingRules = [
    [/akashi/g, "আকাশি"],
    [/আকাশী/g, "আকাশি"],

    [/kamala/g, "কমলা"],
    [/komla/g, "কমলা"],
    [/komola/g, "কমলা"],

    [/কাল$/, "কালো"],
    [/kaalo/g, "কালো"],
    [/kalo/g, "কালো"],

    [/garo/g, "গাঢ"],
    [/gaarho/g, "গাঢ"],

    [/golapi/g, "গোলাপি"],
    [/golabi/g, "গোলাপি"],

    [/nilabho/g, "নীলাভ"],

    [/nil/g, "নীল"],
    [/neel/g, "নীল"],

    [/pink/g, "পিঙক"],

    [/badami/g, "বাদামি"],
    [/বাদামী/g, "বাদামি"],

    [/beguni/g, "বেগুনি"],

    [/lal/g, "লাল"],
    [/laal/g, "লাল"],

    [/sobuj/g, "সবুজ"],
    [/shobuj/g, "সবুজ"],
    [/shobooj/g, "সবুজ"],
    [/shoobooj/g, "সবুজ"],
    [/sabuj/g, "সবুজ"],
    [/sobuj/g, "সবুজ"],
    
    [/holud/g, "হলুদ"],

    [/halka/g, "হালকা"],

    [/magenda/g, "মেজেনটা"],
    [/magenta/g, "মেজেনটা"],
    
    [/pata/g, "পাতা"],

    [/olive/g, "অলিভ"],

    [/khoyeri/g, "খয়েরি"],
    [/khoiri/g, "খয়েরি"],

    [/fyakashe/g, "ফেকাশে"],
    [/phekashe/g, "ফেকাশে"],

    [/mete/g, "মেটে"],
    [/mati/g, "মেটে"],
    [/maati/g, "মেটে"],

    [/khub/g, "খুব"]
    
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}