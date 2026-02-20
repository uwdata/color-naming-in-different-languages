// Romanian (limba română)

const excludeNames = [
    // English color names:
    "blue"
];
const nameReplacingRules = [
    [/fuchsia/, "fucsia"],
    [/închis/, "inchis"],
    ["roșu", "rosu"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}