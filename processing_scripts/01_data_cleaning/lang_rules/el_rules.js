// Greek (modern) (ελληνικά)

const ignoreCharactersForMatching = /[a-zA-Z]/g

const excludeNames = [

];

const nameReplacingRules = [
    [/μοβ/,"μωβ"]
];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}