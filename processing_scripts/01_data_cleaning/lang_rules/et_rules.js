// Estonian (eesti, eesti keel)

const excludeNames = [
    // English names (at least one user entered first half in English, second in Estonian)
    "pink", "purple", "green", "blue", "yellow", "red", "orange"
];

const nameReplacingRules = [
    [/oran$/, "oranz"],
    [/kollakasoheline/, "kollakasroheline"],
    [/neon/, "neoon"],
    [/^sisine$/, "sinine"],
    [/taevassinine/, "taevasinine"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}