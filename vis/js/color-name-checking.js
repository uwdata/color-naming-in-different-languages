const basicColorInfo = await d3.csv("../model/basic_colors_info.csv")

const koreanColors = basicColorInfo.filter(d => d.langAbv == "ko")

$("#data_table")

// TODO: show each color
// and load into a table
// and load wikipedia page for each 
//   color name to see if it changes


// for korean in particular, check count of whether color ending character is present or not 
//  to help find adjective/noun differences