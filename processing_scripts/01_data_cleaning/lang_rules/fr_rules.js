// French (français, langue française)

const excludeNames = [
    // English color names:
    "blue", "green", "purple", "red", "light blue", "yellow", "pink", "electric blue", "king blue", "bright blue", "bright purple", "dark blue", "fluorescent green", "lime", "neon green", "vert flash", "bge", "bleu flashy", "bright green", "electrique", "france", "gold", "green water", "gtz", "jaune primaire", "light green", "marin", "orange red", "printemps", "rose forsythia", "y", "yellow green",

    //nonsense
    "zefza", "fgeklf", "d", "nlndfnzdlanzv", "fezl", "fln", "nl", "l", "d", "fn", "n", "b"
];

// NOTE: Make sure to normalize NFD (string.normalize("NFD"))
const nameReplacingRules = [
    [/aqua$/, "aqua frais"],
    [/aqua marine/, "aquamarine"],

    [/bleu gommette/, "bleu"],
    [/bleur$/, "bleu$"],
    [/blue normal/, "bleu"],

    [/^canard/, "bleu canard"],

    [/^ciel/, "bleu ciel"],
    [/blue ciel/, "bleu ciel"],

    [/bleu claire/, "bleu clair"],
    [/bleau cyan/, "bleu cyan"],
    [/bleu prusse/, "bleu de prusse"],
    [/bleu électrict/, "bleu électrique"],
    [/"bleu émaraude/, "bleu émeraude"],
    [/bleu fnoncé/, "bleu fnoncé"],

    [/bleu marin$/, "bleu marine"],
    [/bleur marine/, "bleu marine"],

    [/vert outremer/, "bleu outremer"],
    [/bleu pale/, "bleu pâle"],
    [/bleu plus pale/, "bleu plus pâle"],
    [/^royal/, "bleu royal"],
    [/jaune bouton d'or/, "bouton d'or"],
    [/bue$/, "buée"],
    [/ecarlate/, "écarlate"],

    [/fushia/, "fuchsia"],
    [/fuschia/, "fuchsia"],
    [/fuchsias/, "fuchsia"],
    [/fuchia/, "fuchsia"],

    [/bleu jade/, "jade"],
    [/jaunatre/, "jaunâtre"],

    [/jauen/, "jaune"],
    [/jeaune/, "jaune "],

    [/jaune brûler/, "jaune brûlé"],

    [/jaune d'œuf frais/, "jaune d'œuf"],
    [/jaune d’oeuf/, "jaune d'œuf"],

    [/jaune vert fluo/, "jaune fluo"],

    [/jaune orange/, "jaune orangé"],
    [/jaune oragne/, "jaune orangé"],

    [/vert jaune/, "jaune vert"],
    [/mentholé/, "menthe"],
    [/mauredoré/, "mordoré"],
    [/organge/, "orange"],
    [/orange brûler/, "orange brûlé"],
    [/orange claire/, "orange clair"],
    [/orange pale/, "orange pâle"],
    [/orange sanguin$/, "orange sanguine"],
    [/pistaccio/, "pistache"],
    [/rose fuchia/, "rose fuchsia"],
    [/rose rouge/, "rose, rouge"],

    [/rouge orange/, "rouge orangé"],
    [/rouge orance/, "rouge orangé"],

    [/turquoi$/, "turquoise"],
    [/turquoisse/, "turquoise"],

    [/rouge vermillion/, "vermillon"],
    [/rouge vermillon/, "vermillon"],

    [/^acide/, "vert acide"],
    [/vert claire/, "vert clair"],
    [/very eau/, "vert d'eau"],
    [/vert mint/, "vert menthe"],
    [/verte pale/, "vert pâle"],

    [/viloet/, "violet"],
    [/voilet/, "violet"],
    [/volet/, "violet"],

    [/violet pale/, "violet pâle"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}