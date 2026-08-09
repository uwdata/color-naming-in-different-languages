// Telugu (తెలుగు)

const excludeNames = [
    // English color names:
    "pink", "purple"
];

const nameReplacingRules = [
    [/aakupachaa/g, "ఆకుపచ్చ"],
    [/aakupacha/g, "ఆకుపచ్చ"],
    [/aaku pachaa/g, "ఆకుపచ్చ"],
    [/aaku pacha/g, "ఆకుపచ్చ"],

    [/ooda r/g, "ఊదా"],
    [/ఉదా/g, "ఊదా"],

    [/erupu/g, "ఎరుపు"],
    [/ఎర్ర/g, "ఎరుపు"],

    [/yerupu/g, "గులాబీ"],
    [/erupu/g, "గులాబీ"],
    [/గులాబి/g, "గులాబీ"],

    [/rangu/g, "రంగు"],

    [/gulabi/g, "గులాబీ"],
    [/gulabhi/g, "గులాబీ"],

    [/chilaka aaku pacha/g, "చిలకపచ్చ"],
    [/చిలుక పచ్చ/g, "చిలకపచ్చ"],

    [/nalupu/g, "నలుపు"],

    [/neelam/g, "నీలం"],
    [/neealam/g, "నీలం"],
    [/nilam/g, "నీలం"],


    [/paccha/g, "పచ్చ"],
    [/pacha/g, "పచ్చ"],

    [/pasupu/g, "పసుపు"],

    [/పసుప్పచ్చ/g, "పసుపుపచ్చ"], //pasupupacha

    [/vankaya/g, "వంకాయ"],
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}