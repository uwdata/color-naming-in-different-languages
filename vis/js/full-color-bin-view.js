class FullColorBinView {
    constructor(options) {
        this.TILE_SEGMENT_MARGIN_NUM = 3 // 3 tiles worth between each "level"
        this.bin_size = options.bin_size
        this.bin_array = options.bin_array
        this.nested_bins = this.binsArrayToNested(this.bin_array)
        this.x_dim = options.x_dim,
        this.y_dim = options.y_dim,
        this.split_dim = options.split_dim
        this.findDimBounds()
    }


    binsArrayToNested(labBinArray) {
        const nestedData = {}
        const [dim1, dim2, dim3] = this.bin_size.dims
        for(const bin of labBinArray){
            const dim1_bin = bin[dim1+"_bin"]
            const dim2_bin = bin[dim2+"_bin"]
            const dim3_bin = bin[dim3+"_bin"]

            if(!(dim1_bin in nestedData)){
                nestedData[dim1_bin] = {}
            }

            if(!(dim2_bin in nestedData[dim1_bin])){
                nestedData[dim1_bin][dim2_bin] = {}
            }

            nestedData[dim1_bin][dim2_bin][dim3_bin] = bin
        }
        return nestedData
    }

    findDimBounds(){
        const [dim1, dim2, dim3] = this.bin_size.dims

        // check if the bin dims match the display dims in a way which means we are displaying ring arcs
        const areRingArcs = [this.x_dim, this.y_dim].includes("a") && [dim1, dim2, dim3].includes("h")
        // for the c-radius we need to correct for whether it is a 3 or 8 h division
        const arcCToABRadiusCorrection = (this.bin_size.h_divs == 3 ? 0.5 : 1) / this.bin_size.c

        this[dim1 + "_nums"] = []
        this[dim2 + "_nums"] = []
        this[dim3 + "_nums"] = []
        if(areRingArcs){
            this[this.x_dim + "_nums"] = []
            this[this.y_dim + "_nums"] = []
            this[this.split_dim + "_nums"] = [] // probably duplicates shared "l" in lab/lch 
        }
        this.splitDimNums = {}

        for(const bin of this.bin_array){
            const dim1_bin = bin[dim1 + "_bin"]
            const dim2_bin = bin[dim2 + "_bin"]
            const dim3_bin = bin[dim3 + "_bin"]

            // track the range of bin numbers in each direction
            if(!this[dim1 + "_nums"].includes(dim1_bin)){
                this[dim1 + "_nums"].push(dim1_bin)
            }
            if(!this[dim2 + "_nums"].includes(dim2_bin)){
                this[dim2 + "_nums"].push(dim2_bin)
            }
            if(!this[dim3 + "_nums"].includes(dim3_bin)){
                this[dim3 + "_nums"].push(dim3_bin)
            }
            if(areRingArcs){
                const a_bin_center = arcCToABRadiusCorrection * bin.c_center * Math.cos(bin.h_center / 360 * 2* Math.PI)
                const b_bin_center = arcCToABRadiusCorrection * bin.c_center * Math.sin(bin.h_center / 360 * 2* Math.PI)
                let dim_x_bin, dim_y_bin
                if(this.x_dim == "a"){
                    dim_x_bin = a_bin_center
                    dim_y_bin = b_bin_center
                } else {
                    dim_x_bin = b_bin_center
                    dim_y_bin = b_bin_center
                }
                //const dim_x_bin = 
                //const dim_y_bin = bin[this.y_dim + "_bin"]
                const dim_split_bin = bin[this.split_dim + "_bin"] // probably duplicates shared "l" in lab/lch 


                if(!this[this.x_dim + "_nums"].includes(dim_x_bin)){
                    this[this.x_dim + "_nums"].push(dim_x_bin)
                }
                if(!this[this.y_dim + "_nums"].includes(dim_y_bin)){
                    this[this.y_dim + "_nums"].push(dim_y_bin)
                }
                // probably duplicates shared "l" in lab/lch 
                if(!this[this.split_dim + "_nums"].includes(dim_split_bin)){
                    this[this.split_dim + "_nums"].push(dim_split_bin)
                }
            }

            // track the range of bin numbers in each level
            const splitDimBinNum = bin[this.split_dim + "_bin"]
            if(!(splitDimBinNum in this.splitDimNums)){
                this.splitDimNums[splitDimBinNum] = {
                    [this.x_dim]: [],
                    [this.y_dim]: []
                }
                if(areRingArcs){
                    this.splitDimNums[splitDimBinNum].h = []
                    this.splitDimNums[splitDimBinNum].c = []
                }
            }
            
            if(!areRingArcs){ // normal square bins:
                const xDimNum = bin[this.x_dim + "_bin"]
                if(!(this.splitDimNums[splitDimBinNum][this.x_dim].includes(xDimNum))){
                    this.splitDimNums[splitDimBinNum][this.x_dim].push(xDimNum)
                }
                const yDimNum = bin[this.y_dim + "_bin"]
                if(!(this.splitDimNums[splitDimBinNum][this.y_dim].includes(yDimNum))){
                    this.splitDimNums[splitDimBinNum][this.y_dim].push(yDimNum)
                } 
            } else { // arc bins
                // TODO: We want need the a and b in "bin" dimensions


                // we assume split_dim is l, x/y dims are a/b, and that we have c/h data
                if(this.split_dim !== "l" || ![this.x_dim, this.y_dim].includes("a") ||
                   ![this.x_dim, this.y_dim].includes("b") || !("c_bin" in bin) || !("h_bin" in bin)){
                    throw new Error("Arc bin detected, but not expected dimensions of x/y dims: a/b, split dim: l, and bin c/h data")
                }

                // track c and h nums
                if(!(this.splitDimNums[splitDimBinNum].c.includes(bin.c_bin))){
                    this.splitDimNums[splitDimBinNum].c.push(bin.c_bin)
                }
                if(!(this.splitDimNums[splitDimBinNum].h.includes(bin.h_num))){
                    this.splitDimNums[splitDimBinNum].h.push(bin.h_num)
                } 

                // for each arc, consider the center line of the arc in the c
                // direction, and calculate the max x/y values of that center line
                if(bin.c_center == 0){ // bin at center is a circle at x/y 0
                    const xDimNum = 0
                    const yDimNum = 0
                    if(!(this.splitDimNums[splitDimBinNum][this.x_dim].includes(xDimNum))){
                        this.splitDimNums[splitDimBinNum][this.x_dim].push(xDimNum)
                    }
                    if(!(this.splitDimNums[splitDimBinNum][this.y_dim].includes(yDimNum))){
                        this.splitDimNums[splitDimBinNum][this.y_dim].push(yDimNum)
                    } 
                } else { // arc, not a circle at the center
                    // sine starts goes 0 -> 1 -> 0 -> -1
                    // cosine goes 1 -> 0 -> -1 -> 0
                    // a goes with cosine, b goes with sine

                    let a_min, b_min, a_max, b_max
                    
                    // a max (h 0 degrees, a+ / b0)
                    // if h overlaps with 0, then max a is just "c"
                    if(bin.h_min > bin.h_max || [0,360].includes(bin.h_min) || [0,360].includes(bin.h_max)){
                        a_max = arcCToABRadiusCorrection * bin.c_center
                    } else{
                        a_max = arcCToABRadiusCorrection * bin.c_center * Math.max(
                            Math.cos(bin.h_min / 360 * 2* Math.PI),
                            Math.cos(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // b max (90 degrees is b+ / a0)
                    if(bin.h_min <= 90 && bin.h_max >= 90){
                        b_max = arcCToABRadiusCorrection * bin.c_center
                    } else{
                        b_max = arcCToABRadiusCorrection * bin.c_center * Math.max(
                            Math.sin(bin.h_min / 360 * 2* Math.PI),
                            Math.sin(bin.h_max / 360 * 2* Math.PI)
                        )
                    }
                    
                    // a min (180 degrees is a- / b0)
                    if(bin.h_min <= 180 && bin.h_max >= 180){
                        a_min = arcCToABRadiusCorrection * -bin.c_center
                    } else{
                        a_min = arcCToABRadiusCorrection * bin.c_center * Math.min(
                            Math.cos(bin.h_min / 360 * 2* Math.PI),
                            Math.cos(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // b min 270 degrees is b- / a0
                    if(bin.h_min <= 270 && bin.h_max >= 270){
                        b_min = arcCToABRadiusCorrection * -bin.c_center
                    } else{
                        b_min = arcCToABRadiusCorrection * bin.c_center * Math.max(
                            Math.sin(bin.h_min / 360 * 2* Math.PI),
                            Math.sin(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // update a/b values with mins and maxes
                    if(!(this.splitDimNums[splitDimBinNum].a.includes(a_min))){
                        this.splitDimNums[splitDimBinNum].a.push(a_min)
                    }
                    if(!(this.splitDimNums[splitDimBinNum].a.includes(a_max))){
                        this.splitDimNums[splitDimBinNum].a.push(a_max)
                    }
                    if(!(this.splitDimNums[splitDimBinNum].b.includes(b_min))){
                        this.splitDimNums[splitDimBinNum].b.push(b_min)
                    }
                    if(!(this.splitDimNums[splitDimBinNum].b.includes(b_max))){
                        this.splitDimNums[splitDimBinNum].b.push(b_max)
                    }
                }
            }            
        }
        this[dim1 + "_nums"].sort((a,b) => a - b)
        this[dim2 + "_nums"].sort((a,b) => a - b)
        this[dim3 + "_nums"].sort((a,b) => a - b)

        this[dim1 + "_min_bin"] = Math.min(... this[dim1 + "_nums"])
        this[dim1 + "_max_bin"] = Math.max(... this[dim1 + "_nums"])

        this[dim2 + "_min_bin"] = Math.min(... this[dim2 + "_nums"])
        this[dim2 + "_max_bin"] = Math.max(... this[dim2 + "_nums"])

        this[dim3 + "_min_bin"] = Math.min(... this[dim3 + "_nums"])
        this[dim3 + "_max_bin"] = Math.max(... this[dim3 + "_nums"])

        if(areRingArcs){
            this[this.x_dim + "_min_bin"] = Math.min(... this[this.x_dim + "_nums"])
            this[this.x_dim + "_max_bin"] = Math.max(... this[this.x_dim + "_nums"])

            this[this.y_dim + "_min_bin"] = Math.min(... this[this.y_dim + "_nums"])
            this[this.y_dim + "_max_bin"] = Math.max(... this[this.y_dim + "_nums"])
        }

        // calculate min/max of split values
        this.splitLevelRanges = {}
        for(const [l, levelNums] of Object.entries(this.splitDimNums)){
            levelNums[this.x_dim].sort((a,b) => a - b)
            levelNums[this.y_dim].sort((a,b) => a - b)

            this.splitLevelRanges[l] = {
                [this.x_dim]: {
                    min: Math.min(...levelNums[this.x_dim]),
                    max: Math.max(...levelNums[this.x_dim])
                },
                [this.y_dim]: {
                    min: Math.min(...levelNums[this.y_dim]),
                    max: Math.max(...levelNums[this.y_dim])
                }
            }
        }
    }

    getDisplayOffsets(){
        const y_offset_in_bins = this[this.y_dim + "_max_bin"] + this.TILE_SEGMENT_MARGIN_NUM
        const y_height_in_bins =  y_offset_in_bins - this[this.y_dim + "_min_bin"] + this.TILE_SEGMENT_MARGIN_NUM

        const x_offsets_in_bins = {}
        let currXBinOffset = this.TILE_SEGMENT_MARGIN_NUM 
        let x_width_in_bins

        for(const [split_bin, ranges] of Object.entries(this.splitLevelRanges)){
            currXBinOffset = currXBinOffset - ranges[this.x_dim].min

            x_offsets_in_bins[split_bin] = currXBinOffset

            // adjust for positive direction
            currXBinOffset = currXBinOffset + ranges[this.x_dim].max + this.TILE_SEGMENT_MARGIN_NUM 
            
            // only the last one will be saved at the end, giving us total svg width
            x_width_in_bins = currXBinOffset
        }

        return {
            y_offset_in_bins: y_offset_in_bins,
            y_height_in_bins: y_height_in_bins,
            x_offsets_in_bins: x_offsets_in_bins,
            x_width_in_bins: x_width_in_bins
        }
    }

    setDisplayOffsets(display_offsets){
        this.display_offsets = display_offsets
    }


    createOrUpdateColorTiles(parentElement, backgroundColor){
        const thisView = this;
        const displayWidth = parentElement.attr("width")
        
        // TODO: remove the fallback values when I fix the other calculations
        const tileSize = displayWidth / this.display_offsets.x_width_in_bins || 5
        const tileBorderSize = displayWidth / this.display_offsets.x_width_in_bins / 5 || 1

        const [dim1, dim2, dim3] = this.bin_size.dims

        const areRingArcs = [this.x_dim, this.y_dim].includes("a") && [dim1, dim2, dim3].includes("h")

        if(!areRingArcs){ // regular square bins

            // clear any old arc or circle tiles
            parentElement.selectAll(".arc-tile")
                .data([])
                .join("path")
            parentElement.selectAll(".circle-tile")
                .data([])
                .join("path")

            parentElement.selectAll(".tile")
                .data(this.bin_array)
                .join("rect")
                .attr("class", "tile")
                .style("stroke", backgroundColor)
                .style("stroke-width", d => tileBorderSize)
                .attr("x", (d) => {
                    const x =  tileSize * 
                        (d[thisView.x_dim + "_bin"] + thisView.display_offsets.x_offsets_in_bins[d[thisView.split_dim + "_bin"]])
                    if(isNaN(x)){
                        console.log("x is NAN")
                        debugger
                    }
                    return x
                    })

                .attr("y", (d) => 
                    tileSize * 
                    (-d[thisView.y_dim + "_bin"] + thisView.display_offsets.y_offset_in_bins)
                )
                .attr("fill", (d) => {
                        return thisView.bin_size.type == "ring" ?
                        `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                        :
                        `oklab(${d.l_center} ${d.a_center} ${d.b_center})`
                    })
                .attr("height", tileSize)
                .attr("width", tileSize)
                .attr("title", (d) => {
                    let info = `
                    ${thisView.bin_size.type == "ring" ?
                        `Bin Center (l, c, h): ${Math.round(d.center_lch.l *10000, 1)/10000}, ${Math.round(d.center_lch.c*10000, 1)/10000}, ${Math.round(d.center_lch.h*10000, 1)/10000}` 
                        :""}
                    Bin Center (l, a, b): ${Math.round(d.center_lab.l *10000, 1)/10000}, ${Math.round(d.center_lab.a*10000, 1)/10000}, ${Math.round(d.center_lab.b*10000, 1)/10000}
                    Bin Center (r, g, b): ${Math.round(d.center_rgb.r, 1)}, ${Math.round(d.center_rgb.g, 1)}, ${Math.round(d.center_rgb.b, 1)}
                    Bin percent valid rgb: ${d.ratio_bin_in_gamut_rgb * 100}
                    ${("representative_rgb" in d)
                        ?
                        `Example RGB in tile (r, g, b): ${d.representative_rgb.r}, ${d.representative_rgb.g}, ${d.representative_rgb.b}}` 
                        : ""
                    }`.trim()
                    return info
                })
            } else {
                // clear any old square tiles
                parentElement.selectAll(".tile")
                    .data([])
                    .join("rect")

                parentElement.selectAll(".circle-tile")
                    .data(this.bin_array.filter(d => d.c_bin == 0))
                    .join("circle")
                    .attr("class", "circle-tile")
                    .attr("cx", d =>  tileSize* thisView.display_offsets.x_offsets_in_bins[d[thisView.split_dim + "_bin"]])
                    .attr("cy", d =>  tileSize* thisView.display_offsets.y_offset_in_bins)
                    .attr("r",  d => {
                        const binRadius = d.c_max/thisView.bin_size.c*tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1) - 0.5 * tileBorderSize
                        return binRadius
                    })
                    .attr("fill", d => {
                        return `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                    })
                    .attr("title", (d) => {
                        let info = `
                        Bin Center (l, c, h): ${Math.round(d.center_lch.l *10000, 1)/10000}, ${Math.round(d.center_lch.c*10000, 1)/10000}, ${Math.round(d.center_lch.h*10000, 1)/10000}
                        Bin Center (l, a, b): ${Math.round(d.center_lab.l *10000, 1)/10000}, ${Math.round(d.center_lab.a*10000, 1)/10000}, ${Math.round(d.center_lab.b*10000, 1)/10000}
                        Bin Center (r, g, b): ${Math.round(d.center_rgb.r, 1)}, ${Math.round(d.center_rgb.g, 1)}, ${Math.round(d.center_rgb.b, 1)}
                        Bin percent valid rgb: ${d.ratio_bin_in_gamut_rgb * 100}
                        ${("representative_rgb" in d)
                            ?
                            `Example RGB in tile (r, g, b): ${d.representative_rgb.r}, ${d.representative_rgb.g}, ${d.representative_rgb.b}}` 
                            : ""
                        }`.trim()
                        return info
                    })
                    


                parentElement.selectAll(".arc-tile")
                    .data(this.bin_array.filter(d => d.c_bin != 0))
                    .join("path")
                    .attr("class", "arc-tile")
                    .style("stroke", d => {
                        return `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                    })
                    .attr("d", d => {
                        const levelCenterX = tileSize* thisView.display_offsets.x_offsets_in_bins[d[thisView.split_dim + "_bin"]] 
                        const levelCenterY =  tileSize* this.display_offsets.y_offset_in_bins
                        const binRadius = d.c_center/thisView.bin_size.c*tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1)
                        const endAngleMargin = (d.h_min + (thisView.bin_size.h_divs == 3 ? 8 : 5) / d.c_center * thisView.bin_size.c)
                        const startAngleMargin = (d.h_max - (thisView.bin_size.h_divs == 3 ? 8 : 5) / d.c_center * thisView.bin_size.c)
                        const binStartDeltaX = binRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
                        const binStartX = levelCenterX + binStartDeltaX
                        const binEndDeltaX = binRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
                        const binEndX = levelCenterX  + binEndDeltaX
                        const binStartDeltaY = binRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
                        const binStartY = levelCenterY - binStartDeltaY // minus to correct for display y axis has + go down
                        const binEndDeltaY = binRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)  
                        const binEndY = levelCenterY - binEndDeltaY

                        return `
                        M ${binStartX} ${binStartY} 
                        A ${binRadius} ${binRadius} 0 0 1 ${binEndX} ${binEndY}
                        `
                    }) // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                    .style("stroke-width", tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1) - 1 * tileBorderSize)//d => curr_bin_size.tileBorderSize)
                    .attr("fill", "rgba(0,0,0,0)")
                    .attr("title", (d) => {
                        let info = `
                        Bin Center (l, c, h): ${Math.round(d.center_lch.l *10000, 1)/10000}, ${Math.round(d.center_lch.c*10000, 1)/10000}, ${Math.round(d.center_lch.h*10000, 1)/10000}
                        Bin Center (l, a, b): ${Math.round(d.center_lab.l *10000, 1)/10000}, ${Math.round(d.center_lab.a*10000, 1)/10000}, ${Math.round(d.center_lab.b*10000, 1)/10000}
                        Bin Center (r, g, b): ${Math.round(d.center_rgb.r, 1)}, ${Math.round(d.center_rgb.g, 1)}, ${Math.round(d.center_rgb.b, 1)}
                        Bin percent valid rgb: ${d.ratio_bin_in_gamut_rgb * 100}
                        ${("representative_rgb" in d)
                            ?
                            `Example RGB in tile (r, g, b): ${d.representative_rgb.r}, ${d.representative_rgb.g}, ${d.representative_rgb.b}}` 
                            : ""
                        }`.trim()
                        return info
                    })
            }
    }
}


export default FullColorBinView