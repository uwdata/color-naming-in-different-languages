# Processing Scripts

These are scripts that go from the raw data into the various processed data and models in the "models" folder.

# Stage 0: Pre-processing colors
These scripts are to calculate things about colors and color spaces before considering any color naming. 

In the "00_pre-processing-colors/" folder.

# Step 1: Data Cleaning

These files help in cleaning the naming data, including matching names like "light-green" and "light green," ignoring casing and diacritic marks, removing data entered in the wrong language, spelling mistakes, etc.

In the "01_data_cleaning/" folder.

# Stage 2: Initial Processing

These scripts take the cleaned color name data and processes it to get various summaries of color names and color bins.

In the "02_initial_processing/" folder.

# Stage 3: Advanced Processing

These scripts are use the initial processing data to make more advanced models and calculations.

In the "03_advanced_processing/" folder.

# Utility code

These are utility files used by other scripts

In the "utils/" folder.