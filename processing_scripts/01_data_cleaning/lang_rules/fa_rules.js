// Persian (Farsi) (فارسی),صورتی,صورتی,صورتی

const ignoreCharactersForMatching = /[^\u0600-\u06FF ]/ig

const keepSpaces = true

const excludeNames = [
    
];

const nameReplacingRules = [
    [/\u0653/g, ""] // "آ" -> "ا"
];

const additionalReplacementRule = (str) => {
    return str.split(" ")
        .map(n => 
          n.replace(/\u064A$/,"ی")) // "ي" -> "ی"
        .join(" ");
}

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules,
    additionalReplacementRule: additionalReplacementRule,
    keepSpaces: keepSpaces
}