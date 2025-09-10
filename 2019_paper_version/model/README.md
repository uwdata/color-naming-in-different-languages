# Model

This folder contains the color naming models and the translation loss which we referred in our paper and the scripts creating them.

Each color naming model is a JSON array of color-name pairs. Each pair has the below properties:

- lang : Language
- binNum/binL/binA/binB : Index of Color Bin
- term : Color name
- cnt : Count
- pCT : Probability of a color (c) given a term (t) (P(c|t))
- pTC : Probability of a term (t) given a color (c) (P(t|c))
- schema : (for scheme_color_model only) Schema


`translation_loss` is also an array having the translation losses between the top 100 English and Korean color name for full colors. 'dist' property indicate the distance (loss) between the English term (enTerm) and the Korean term (koTerm).


Note: We represent the color labels provided by the participants in our study, which includes whatever racial biases they have (e.g., the color "skin"). This is not meant to be a prescriptive definition of what colors  fit what labels.
