# Many Languages, Many Colors Dataset
## Color Naming Data, Models, Translations, and Visualizations

Official Website is located at [https://uwdata.github.io/color-naming-in-different-languages](https://uwdata.github.io/color-naming-in-different-languages)

This repository contains supplement material of [the paper](http://idl.cs.washington.edu/papers/multi-lingual-color-names/) including:
- Color-name judgements that are collected from our 12 minute [color perception survey](http://labinthewild.org/studies/color_perception/) on [LabIntheWild](https://labinthewild.org/)
- Color naming probabilistic models for _hue colors_ and _full colors_
- Interactive visualizations
  - [Color Translator](https://uwdata.github.io/color-naming-in-different-languages/vis/color_compare.html) Finds similar colors in the same language or across languages.
  - [The probabilities of terms for each hue color bin across 14 languages](https://uwdata.github.io/color-naming-in-different-languages/vis/color-composition-figure.html)
  - [Interactive version of the above](https://uwdata.github.io/color-naming-in-different-languages/vis/stacked-spectrum.html)
  - [Maximum Probability Maps for English and Korean color names](https://uwdata.github.io/color-naming-in-different-languages/vis/full_color_maps.html)
  - [Comparison of translations](https://uwdata.github.io/color-naming-in-different-languages/vis/en-ko-translation-comparison.html)
  - [The probabilities of viridis colors for some nameable terms](https://uwdata.github.io/color-naming-in-different-languages/vis/viridis.html)

**Note: But note a few difficulties with processing the data:**
- In our paper we made an error in calculating distance (we had measured distance by 10x LAB bins, instead of regular LAB space) so our distance measure was 10x too small, making us underestimate what changes were noticeable. This does not change our conclusions.
- Additionally, when we try re-running the processing now we sometimes get slightly different results, than the paper
      probably due to library changes and subtle effects on processing (e.g., CSV file edge cases, handling unusual unicode values) 
      though we haven't figured out exactly what the differences are.


## Cite us!

If you use the data in published research, please cite this paper:
[Color Names Across Languages: Salient Colors and Term Translation in Multilingual Color Naming Models](http://idl.cs.washington.edu/papers/multi-lingual-color-names/). [Younghoon Kim](https://yhoonkim.github.io/), [Kyle Thayer](http://www.kylethayer.com), Gabriella Silva Gorsky, and [Jeffery Heer](https://homes.cs.washington.edu/~jheer) (2019). [EuroVis](https://www.eurovis.org).
