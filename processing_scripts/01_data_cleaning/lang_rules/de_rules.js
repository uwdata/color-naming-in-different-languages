// German (Deutsch)

const excludeNames = [
    // English color names:
    "blue", "cyan", "green", "red", "yellow"
];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [
    [/gruen/, "grün"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}