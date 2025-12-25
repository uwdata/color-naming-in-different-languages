// Russian (Русский),фиолетовыи,фиолетовый,фиолетовый

const ignoreCharactersForMatching = /[^а-яА-Я]/ig

const excludeNames = [

];

const nameReplacingRules = [
    [/sholte/, "желтый"],
    [/xolte/, "желтый"],

    [/жлтый/, "желтый"],

    [/zelone/, "зеленый"],
    [/celone/, "зеленый"],
    [/зелный/, "зеленый"],

    [/djelatoi/, "золотой"],
    [/krasne/, "красный"],
    [/arangeve/, "оранжевый"],
    [/roseve/, "розовый"],
    
    [/cene/, "синий"],
    [/cenya/, "синий"]
];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}