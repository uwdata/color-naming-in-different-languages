const d3 = require('d3'),
    fs = require('fs')

const hueColors = []

let r = 255
let g = 0
let b = 0
let cumulative_distance = 0
let lastLab = d3.lab(d3.color(`rgb(${r},${g},${b})`))

function addColorInfo(){
    const lab = d3.lab(d3.color(`rgb(${r},${g},${b})`))
    const dist = Math.sqrt((lab.l - lastLab.l)**2 + (lab.a - lastLab.a)**2 + (lab.b - lastLab.b)**2)
    cumulative_distance += dist
    hueColors.push({
        "rgb": {
            r: r,
            g: g,
            b: b
        },
        "lab": {
            l: lab.l,
            a: lab.a,
            b: lab.b
        },
        cumulative_dist: cumulative_distance
    })
    lastLab = lab
}

//r 255
// g - 0 - 255
for(g = 0; g < 255; g++){
    addColorInfo()
}
// r 255 - 0
for(r = 255; r > 0; r--){
    addColorInfo()
}
// b - 0 - 255
for(b = 0; b < 255; b++){
    addColorInfo()
}
// g - 255 - 0
for(g = 255; g > 0; g--){
    addColorInfo()
}
// r  - 0 - 255
for(r = 0; r < 255; r++){
    addColorInfo()
}
// b - 255 - 0
for(b = 255; b > 0; b--){
    addColorInfo()
}

for(let i = 0; i < hueColors.length; i++){
    if(i != hueColors.length - 1){
        hueColors[i].next_dist = hueColors[i+1].cumulative_dist - hueColors[i].cumulative_dist
    } else {
        const nextLab = hueColors[0].lab
        const thisLab = hueColors[i].lab
        const dist = Math.sqrt((nextLab.l - thisLab.l)**2 + (nextLab.a - thisLab.a)**2 + (nextLab.b - thisLab.b)**2)
        hueColors[i].next_dist = dist
    }
}

console.log(hueColors)
fs.writeFileSync("../../model/color_info_pre_naming/hue_colors.json", JSON.stringify(hueColors, null, 2));