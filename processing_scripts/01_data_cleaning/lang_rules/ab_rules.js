//Abkhaz (аҧсуа бызшәа, аҧсшәа)

const excludeNames = [
    // nonsense names
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "s", 
    // English color names:
    "blue", "green", "magenta", "orange", "pink", "purple", "red", "yellow"
];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [

];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}