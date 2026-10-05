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
    [/akkupacha/g, "ఆకుపచ్చ"],
    [/aku pacha/g, "ఆకుపచ్చ"],

    [/ooda r/g, "ఊదా"],
    [/ooda/g, "ఊదా"],
    [/ఉదా/g, "ఊదా"],

    [/yerupu/g, "ఎరుపు"],
    [/erupu/g, "ఎరుపు"],
    [/ఎర్ర/g, "ఎరుపు"],

    [/rangu/g, "రంగు"],

    [/gulabi/g, "గులాబీ"],
    [/gulabhi/g, "గులాబీ"],
    [/గులాబి/g, "గులాబీ"],

    [/chilaka aaku pacha/g, "చిలకపచ్చ"],
    [/చిలుక పచ్చ/g, "చిలకపచ్చ"],

    [/nalupu/g, "నలుపు"],

    [/neelam/g, "నీలం"],
    [/neealam/g, "నీలం"],
    [/nilam/g, "నీలం"],

    [/narinja/g, "నారింజ"],


    [/paccha/g, "పచ్చ"],
    [/pacha/g, "పచ్చ"],

    [/pasupu/g, "పసుపు"],

    [/పసుప్పచ్చ/g, "పసుపుపచ్చ"], //pasupupacha

    [/vankaya/g, "వంకాయ"],

    [/chilaka/g, "చిలుక"],
    [/చిలుక/g, "చిలుక"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}