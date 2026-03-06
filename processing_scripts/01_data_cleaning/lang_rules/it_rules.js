// Italian (italiano)

const excludeNames = [
    // English color names:
    "blue"
];
const nameReplacingRules = [
    [/arancio$/, "arancione"],

    [/fuchsia/, "fucsia"],
    [/fucsha/, "fucsia"],
    [/fucshia/, "fucsia"],
    [/fuxia/, "fucsia"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}