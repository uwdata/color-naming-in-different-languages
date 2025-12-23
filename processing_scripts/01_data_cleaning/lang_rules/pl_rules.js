// Polish (język polski, polszczyzna)

const excludeNames = [
    // English color names:
    "pink", "blue"
];
const nameReplacingRules = [
    [/blekitny/, "błękitny"], 
    [/ciemny/, "ciemno"],
    [/jasny/, "jasno"],
    [/pomaranczowy/, "pomarańczowy"], 
     ["rozowy", "różowy"],
    ["zolty", "żółty"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}