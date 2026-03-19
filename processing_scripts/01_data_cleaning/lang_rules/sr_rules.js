// Serbian (српски језик)

const excludeNames = [
];
const nameReplacingRules = [
    [/crvena/, "црвена"],

    [/ljubicasta/, "љубичаста"],
    [/ljibicasta/, "љубичаста"],

    [/naradzasta/, "наранџаста"],
    [/narandzasta/, "наранџаста"],

    [/plava/, "плава"],

    [/roza/, "розе"],
    [/roze/, "розе"],

    [/svetlo/, "светло"],
    [/tamno/, "тамно"],

    [/tirkizna/, "тиркизна"],

    [/zelena/, "зелена"],
    [/zuta/, "жута"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}