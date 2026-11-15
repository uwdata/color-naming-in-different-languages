// Georgian (ქართული)

const excludeNames = [
];

const nameReplacingRules = [
    [/vardisperi/, "ვარდისფერი"],
    
    [/lurji/, "ლურჯი"],

    [/iasamnisferi/, "იასამნისფერი"],
    
    [/stafilosferi/, "სტაფილოსფერი"],

    [/gia/, "ღია"],

    [/muki/, "მუქი"],
    [/muqi/, "მუქი"],

    [/shavi/, "შავი"],
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}