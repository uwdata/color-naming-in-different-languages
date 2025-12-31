// Greek (modern) (ελληνικά)

const ignoreCharactersForMatching = /[a-zA-Z]/g

const excludeNames = [

];

const nameReplacingRules = [
    [/anoixto/, "ανοιχτο"],

    [/galazio/, "γαλαζιο"],

    [/μοβ/,"μωβ"],
    [/mov/, "μωβ"], // ???
    [/mwv/, "μωβ"], // ???

    [/θαλλασι/, "θαλασσι"],

    [/kitrino/, "κιτρινο"],

    [/kokkino/, "κοκκινο"],
    [/κικκινο/, "κοκκινο"],

    [/κοραλι/, "κοραλλι"],

    [/mple/, "μπλε"],

  

    [/\[ρασινο/, "πρασινο"],
    [/prasino/, "πρασινο"],

    [/portokali/, "πορτοκαλι"],
    [/ποτροκαλι/, "πορτοκαλι"],

    [/τικουαζ/, "τιρκουαζ"],
    [/tirkouaz/, "τιρκουαζ"],
    [/τυρκουαζ/, "τιρκουαζ"],

    [/fouksia/, "φουξια"],
    [/fouskia/, "φουξια"],

    
    [/ωχρο/, "ωχρα"]

];

export default {
    ignoreCharactersForMatching: ignoreCharactersForMatching,
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}