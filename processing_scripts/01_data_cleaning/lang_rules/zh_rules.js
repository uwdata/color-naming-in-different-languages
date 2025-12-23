// Chinese (中文 (Zhōngwén), 汉语, 漢語)

const excludeNames = [
    // nonsense names
    "1"
];
const nameReplacingRules = [
    [/天空蓝/, "天蓝"],
    [/桔黄/, "橘黄"],
    [/枚红/, "玫红"],
    [/玫瑰红/, "玫红"],
    [/紫粉/, "粉紫"],
    [/红粉/, "粉红"],
    [/红紫/, "紫红"],
    [/萤光/, "荧光"],
    [/荧光蓝/, "萤光蓝"],
    [/兰/, "蓝"],
    [/紫蓝/, "蓝紫"],
    [/绿青/, "青绿"],
    [/蓝青/, "青蓝"],
    [/青色带蓝/, "青蓝"],
    [/绿黄/, "黄绿"]
];

export default {
    excludeNames: excludeNames,
    nameReplacingRules: nameReplacingRules
}