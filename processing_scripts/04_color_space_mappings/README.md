# Color Space Mappings Scripts

Note: These scripts have not been created yet, these are for now notes on what the plan is.

When we collect color data, there are different color conditions under which it is collected:
- Different color spaces depending on device/browser compatibility ("colorSpace" field)
  - "srgb"
  - "p3"
  - "rec2020"
- Different color backgrounds ("background" field)
  - "white" background (light-mode)
  - "black" background (dark-mode)
- Also in demographics there are other factors we could account for:
  - surroundingBrightness
  - monitorBrightness
  - colorBlindness (much of this data didn't save properly, but we could also potentially we could use color sorting results)
  - Device type might be deducible from some of the data

_Note: for all data in version 1.x, the color space is "srgb" and background is "white"_

This allows us to map color spaces between these different conditions, that way we can standardize the data we get and use it to produce color information and color binned data that accounts for the differences and is set in these different color spaces.

We find the average value & max bin of each color term in the different conditions and map them to the average value & max bin in the other spaces. We then use our OKLCH binning to find a general mapping between each color condition (e.g., in each bin how L should change, C should change and H should change. If it works well, I expect that Hue shouldn't change).

Note: 
- For different averages / max values, we'll weight them according to standard error, which scales at 1/sqrt(n)
- We'll want to see if these mappings are consistent (e.g., color terms near each other map to the same places in the other space), and see if different languages in isolation produce basically the same mapping.