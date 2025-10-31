// OKLAB Conversion Code

// adapted from https://bottosson.github.io/posts/oklab/
// and other sources as noted in comments

// range of OKLAB values produced when
// converting all rgb colors to Oklab:
const OKLAB_RANGES = {
    l_min: 0,
    l_max: 0.9999999934735462,
    a_min: -0.23388757418790818,
    a_max: 0.27621639742350523,
    b_min: -0.3115281476783751,
    b_max: 0.19856975465179516,
    a_b_abs_max: 0.3115281476783751
}




// just noticeable difference value from
// https://www.w3.org/TR/css-color-4/
const JUST_NOTICEABLE_DIFFERENCE = 0.02

//---- Convert between RGB and Line RGB ------

// gamma functions (convert rgb linear rgb) from here:
// https://observablehq.com/@shan/oklab-color-wheel
function gamma(x) {
    return (x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x)
}
function gamma_inv(x) {
  return x >= 0.04045 ? Math.pow((x + 0.055) / (1 + 0.055), 2.4) : x / 12.92
}

function lineRGBToRGB(rgb_c){
    return {
        r: 255 * gamma(rgb_c.r),
        g: 255 * gamma(rgb_c.g),
        b: 255 * gamma(rgb_c.b)
    }
}

function rgbToLineRGB(rgb_c){
    return {
        r: gamma_inv(rgb_c.r / 255),
        g: gamma_inv(rgb_c.g / 255),
        b: gamma_inv(rgb_c.b / 255)
    }
}

//---- Convert between Line RGB and Oklab ------


function lineRGBToOklab(rgb_c) 
{
    const l = 0.4122214708 * rgb_c.r + 0.5363325363 * rgb_c.g + 0.0514459929 * rgb_c.b;
    const m = 0.2119034982 * rgb_c.r + 0.6806995451 * rgb_c.g + 0.1073969566 * rgb_c.b;
    const s = 0.0883024619 * rgb_c.r + 0.2817188376 * rgb_c.g + 0.6299787005 * rgb_c.b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    return {
        l: 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
        a: 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
        b: 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_,
    };
}

function rgbToOklab(rgb_c){
    return lineRGBToOklab(
        rgbToLineRGB(rgb_c)
    )
}

function oklabToLineRGB(lab_c) 
{
    const l_ = lab_c.l + 0.3963377774 * lab_c.a + 0.2158037573 * lab_c.b;
    const m_ = lab_c.l - 0.1055613458 * lab_c.a - 0.0638541728 * lab_c.b;
    const s_ = lab_c.l - 0.0894841775 * lab_c.a - 1.2914855480 * lab_c.b;

    const l = l_*l_*l_;
    const m = m_*m_*m_;
    const s = s_*s_*s_;

    return {
        r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    };
}

function oklabToRGB(rgb_c){
    return lineRGBToRGB(
        oklabToLineRGB(rgb_c)
    )
}

function oklabToValidRGB(lab_c) 
{
    let {r, g, b} = oklabToRGB(lab_c)

    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)

    clipped = false
    if(r < 0){
      r = 0
      clipped = true
    }
    if(r > 255){
      r = 255
      clipped = true
    }
    if(g < 0){
      g = 0
      clipped = true
    }
    if(g > 255){
      g = 255
      clipped = true
    }
    if(b < 0){
      b = 0
      clipped = true
    }
    if(b > 255){
      b = 255
      clipped = true
    }
    return {r: r, g: g, b: b, clipped: clipped}

}

function oklabToRGBStr(lab_c){
    const {r, g, b} = oklabToValidRGB(lab_c)
    return `rgb(${r},${g},${b})`
}


module.exports = {
    rgbToOklab: rgbToOklab,
    oklabToRGB: oklabToRGB,
    oklabToValidRGB: oklabToValidRGB,
    oklabToRGBStr: oklabToRGBStr,
    OKLAB_RANGES: OKLAB_RANGES,
    JUST_NOTICEABLE_DIFFERENCE: JUST_NOTICEABLE_DIFFERENCE
};