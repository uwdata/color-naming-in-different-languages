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

    getBinInfo(bin){
        if(("bin" + this.bin_size.dims[0].toUpperCase()) in bin){ // if data bin
            return this.nested_bins[
                    bin["bin" + this.bin_size.dims[0].toUpperCase()]
                ][
                    bin["bin" + this.bin_size.dims[1].toUpperCase()]
                ][
                    bin["bin" + this.bin_size.dims[2].toUpperCase()]
                ]
        }
        if(!bin){
            debugger;
        }
        return bin
    }

    findDimBounds(){
        const [dim1, dim2, dim3] = this.bin_size.dims

        // check if the bin dims match the display dims in a way which means we are displaying ring arcs
        const areRingArcs = [this.x_dim, this.y_dim].includes("a") && [dim1, dim2, dim3].includes("h")
        // for the c-radius we need to correct for whether it is a 3 or 8 h division
        const arcCToABRadiusCorrection = this.bin_size.c_ring_width_ratio / this.bin_size.c

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
        // for now only assume l is used for y scale
        const y_scale = this.y_dim == "l" ? this.bin_size.l_scale : 1

        const y_offset_in_bins = (this[this.y_dim + "_max_bin"] +1/2) * y_scale + this.TILE_SEGMENT_MARGIN_NUM
        const y_height_in_bins =  y_offset_in_bins - (this[this.y_dim + "_min_bin"] -1/2) * y_scale + this.TILE_SEGMENT_MARGIN_NUM

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


    createOrUpdateColorTiles(parentElement, options){
        // for now only assume l is used for y scale
        const y_scale = this.y_dim == "l" ? this.bin_size.l_scale : 1

        const backgroundColor = options.backgroundColor || "white"
        const binsToDisplay = "binsToDisplay" in options ? options.binsToDisplay : this.bin_array
        const getTileScale = "getTileScale" in options ? options.getTileScale : () => 1
        
        const getTileColor = "getTileColor" in options ? options.getTileColor : 
            (d, bin) => {
                return thisView.bin_size.type == "ring" ?
                    `oklch(${bin.l_center} ${bin.c_center} ${bin.h_center})`
                    :
                    `oklab(${bin.l_center} ${bin.a_center} ${bin.b_center})`
            }


        const thisView = this;
        const displayWidth = parentElement.attr("width")
        
        // TODO: remove the fallback values when I fix the other calculations
        const tileSizeInBins = 1
        const tileBorderSizeInBins = 1/8
        const tileSize = tileSizeInBins * displayWidth / this.display_offsets.x_width_in_bins
        const tileBorderSize = tileBorderSizeInBins* tileSize


        const [dim1, dim2, dim3] = this.bin_size.dims

         if(options.outline_levels){
            parentElement.selectAll(".level-outline")
                .data(Object.entries(thisView.display_offsets.x_offsets_in_bins))
                .join("line")
                    .attr("class", "level-outline")
                    .attr("x1", (d) => tileSize*(d[1] + thisView.splitLevelRanges[d[0]][thisView.x_dim].max + thisView.TILE_SEGMENT_MARGIN_NUM / 2 ))
                    .attr("y1", (d) => tileSize * (thisView.display_offsets.y_offset_in_bins - thisView[thisView.y_dim + "_max_bin"] * y_scale - 0.5))
                    .attr("x2", (d) => tileSize*(d[1] + thisView.splitLevelRanges[d[0]][thisView.x_dim].max + thisView.TILE_SEGMENT_MARGIN_NUM / 2))
                    .attr("y2", (d)=> tileSize * (thisView.display_offsets.y_offset_in_bins - thisView[thisView.y_dim + "_min_bin"] * y_scale + 0.5)  )
                    .style("stroke", "oklch(70% 0 0 / .5)")
                    .style("stroke-width", tileBorderSize*2)
                    .style("display", (d) => d[0] ==  ""+thisView[thisView.split_dim+"_max_bin"] ? "none" : "") 
        } else {
            parentElement.selectAll(".level-outline")
                .data([])
                .join("line")
        }

        const areRingArcs = [this.x_dim, this.y_dim].includes("a") && [dim1, dim2, dim3].includes("h")

        if(!areRingArcs){ // regular square or rectangle bins

            // clear any old arc or circle tiles
            parentElement.selectAll(".arc-tile")
                .data([])
                .join("path")
            parentElement.selectAll(".circle-tile")
                .data([])
                .join("path")

            let tiles = parentElement.selectAll(".tile")
                .data(binsToDisplay)
                .join("rect")
                .attr("class", "tile")
                .style("stroke", options.no_border ? "" : backgroundColor)
                .style("stroke-width", d => options.no_border ? "" :  tileBorderSize/2)
                .attr("x", (d) => {
                    const bin = thisView.getBinInfo(d)
                    const x =  tileSize * 
                        (bin[thisView.x_dim + "_bin"] // relative position
                            - getTileScale(d) / 2  // minus width/2 for centering
                            + thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]]) // general y position
                    return x
                    })

                .attr("y", (d) => {
                    const bin = thisView.getBinInfo(d)
                    return tileSize *
                        (-bin[thisView.y_dim + "_bin"] * y_scale // relative position
                             - (y_scale) * getTileScale(d) / 2 // minus height/2 for centering
                             + thisView.display_offsets.y_offset_in_bins) // general y position
                })
                .attr("fill", (d) => {
                    const bin = thisView.getBinInfo(d)
                    return getTileColor(d, bin)
                })
                .attr("height", d => (tileSize * y_scale - tileBorderSize) * getTileScale(d))
                .attr("width", d => (tileSize - tileBorderSize) * getTileScale(d))
                .attr("title", (d) => {
                    const bin = thisView.getBinInfo(d)
                    if("getTileTitleText" in options){
                        return options.getTileTitleText(d, bin)
                    }
                    let info = `
                    ${thisView.bin_size.type == "ring" ?
                        `Bin Center (l, c, h): ${Math.round(bin.center_lch.l *10000, 1)/10000}, ${Math.round(bin.center_lch.c*10000, 1)/10000}, ${Math.round(bin.center_lch.h*10000, 1)/10000}` 
                        :""}
                    Bin Center (l, a, b): ${Math.round(bin.center_lab.l *10000, 1)/10000}, ${Math.round(bin.center_lab.a*10000, 1)/10000}, ${Math.round(bin.center_lab.b*10000, 1)/10000}
                    Bin Center (r, g, b): ${Math.round(bin.center_rgb.r, 1)}, ${Math.round(bin.center_rgb.g, 1)}, ${Math.round(bin.center_rgb.b, 1)}
                    Bin percent valid rgb: ${bin.ratio_bin_in_gamut_rgb * 100}
                    ${("representative_rgb" in d)
                        ?
                        `Example RGB in tile (r, g, b): ${bin.representative_rgb.r}, ${bin.representative_rgb.g}, ${bin.representative_rgb.b}}` 
                        : ""
                    }`.trim()
                    return info
                })

                if("mouseover" in options){
                    tiles.on("mouseover", options.mouseover)
                }
                if("mouseout" in options){
                    tiles.on("mouseout", options.mouseout)
                }
                if("click" in options){
                    tiles.on("click", options.click)
                }
        } else {
            // clear any old square tiles
            parentElement.selectAll(".tile")
                .data([])
                .join("rect")

            const circleTiles = parentElement.selectAll(".circle-tile")
                .data(binsToDisplay.filter(d => ("binC" in d && d.binC == 0) || d.c_bin == 0))
                .join("circle")
                .attr("class", "circle-tile")
                .attr("cx", d => {
                    const bin = thisView.getBinInfo(d)
                    return tileSize* thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]]
                })
                .attr("cy", d => tileSize* thisView.display_offsets.y_offset_in_bins)
                .attr("r",  d => {
                    const bin = thisView.getBinInfo(d)
                    const binRadius = getTileScale(d) * (bin.c_max/thisView.bin_size.c - 0.5 * tileBorderSizeInBins)*tileSize * thisView.bin_size.c_ring_width_ratio 
                    return binRadius
                })
                .attr("fill", d => {
                    const bin = thisView.getBinInfo(d)
                    return getTileColor(d, bin)
                })
                .attr("title", (d) => {
                    const bin = thisView.getBinInfo(d)
                    if("getTileTitleText" in options){
                        return options.getTileTitleText(d, bin)
                    }
                    let info = `
                    Bin Center (l, c, h): ${Math.round(bin.center_lch.l *10000, 1)/10000}, ${Math.round(bin.center_lch.c*10000, 1)/10000}, ${Math.round(bin.center_lch.h*10000, 1)/10000}
                    Bin Center (l, a, b): ${Math.round(bin.center_lab.l *10000, 1)/10000}, ${Math.round(bin.center_lab.a*10000, 1)/10000}, ${Math.round(bin.center_lab.b*10000, 1)/10000}
                    Bin Center (r, g, b): ${Math.round(bin.center_rgb.r, 1)}, ${Math.round(bin.center_rgb.g, 1)}, ${Math.round(bin.center_rgb.b, 1)}
                    Bin percent valid rgb: ${bin.ratio_bin_in_gamut_rgb * 100}
                    ${("representative_rgb" in d)
                        ?
                        `Example RGB in tile (r, g, b): ${bin.representative_rgb.r}, ${bin.representative_rgb.g}, ${bin.representative_rgb.b}}` 
                        : ""
                    }`.trim()
                    return info
                })

            if("mouseover" in options){
                circleTiles.on("mouseover", options.mouseover)
            }
            if("mouseout" in options){
                circleTiles.on("mouseout", options.mouseout)
            }
            if("click" in options){
                circleTiles.on("click", options.click)
            }


            const arcTiles = parentElement.selectAll(".arc-tile")
                .data(binsToDisplay.filter(d => !(("binC" in d && d.binC == 0) || d.c_bin == 0)))
                .join("path")
                .attr("class", "arc-tile")
                .style("stroke", d => 
                    options.no_border ? getTileColor(d, thisView.getBinInfo(d))
                    :
                    backgroundColor
                )
                .attr("d", d => {
                    return options.no_border ?
                    getArcPath(d, thisView, tileSize, tileBorderSizeInBins, getTileScale)
                    :
                    getArcPathArea(d, thisView, tileSize, tileBorderSizeInBins, getTileScale)
                }) // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                .style("stroke-width", (d) => 
                    options.no_border ? 
                        getTileScale(d)* tileSize * (thisView.bin_size.c_ring_width_ratio - tileBorderSizeInBins) 
                    :
                        tileBorderSize/2
                )
                .attr("fill", (d) => options.no_border ? "rgba(0,0,0,0)" : getTileColor(d, thisView.getBinInfo(d)) )
                .attr("title", (d) => {
                    const bin = thisView.getBinInfo(d)
                    if("getTileTitleText" in options){
                        return options.getTileTitleText(d, bin)
                    }
                    let info = `
                    Bin Center (l, c, h): ${Math.round(bin.center_lch.l *10000, 1)/10000}, ${Math.round(bin.center_lch.c*10000, 1)/10000}, ${Math.round(bin.center_lch.h*10000, 1)/10000}
                    Bin Center (l, a, b): ${Math.round(bin.center_lab.l *10000, 1)/10000}, ${Math.round(bin.center_lab.a*10000, 1)/10000}, ${Math.round(bin.center_lab.b*10000, 1)/10000}
                    Bin Center (r, g, b): ${Math.round(bin.center_rgb.r, 1)}, ${Math.round(bin.center_rgb.g, 1)}, ${Math.round(bin.center_rgb.b, 1)}
                    Bin percent valid rgb: ${bin.ratio_bin_in_gamut_rgb * 100}
                    ${("representative_rgb" in d)
                        ?
                        `Example RGB in tile (r, g, b): ${bin.representative_rgb.r}, ${bin.representative_rgb.g}, ${bin.representative_rgb.b}}` 
                        : ""
                    }`.trim()
                    return info
                })
            if("mouseover" in options){
                arcTiles.on("mouseover", options.mouseover)
            }
            if("mouseout" in options){
                arcTiles.on("mouseout", options.mouseout)
            }
            if("click" in options){
                arcTiles.on("click", options.click)
            }
        }
        return{
            tileSize: tileSize,
            verticalMargin: tileSize * this.TILE_SEGMENT_MARGIN_NUM
        }
    }
}


function getArcPath(d, thisView, tileSize, tileBorderSizeInBins, getTileScale){
    const bin = thisView.getBinInfo(d)
    const levelCenterX = tileSize* thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]] 
    const levelCenterY =   tileSize* thisView.display_offsets.y_offset_in_bins
    const binRadius = bin.c_center/thisView.bin_size.c*tileSize * thisView.bin_size.c_ring_width_ratio

    const halfAngle = (bin.h_max - bin.h_center) 
    const angleMargin = 0.5 * tileBorderSizeInBins * 360 / (2 * Math.PI * (bin.c_center * thisView.bin_size.c_ring_width_ratio / thisView.bin_size.c))
    const halfAngleWithMargin = halfAngle - angleMargin
    const halfAngleScaled = getTileScale(d) * halfAngleWithMargin
    const endAngleMargin = (bin.h_center - halfAngleScaled)
    const startAngleMargin = (bin.h_center + halfAngleScaled)
        
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
}

function getArcPathArea(d, thisView, tileSize, tileBorderSizeInBins, getTileScale){
    const bin = thisView.getBinInfo(d)
    const levelCenterX = tileSize* thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]] 
    const levelCenterY =   tileSize* thisView.display_offsets.y_offset_in_bins
    // const binInnerRadius = bin.c_min/thisView.bin_size.c*tileSize * thisView.bin_size.c_ring_width_ratio
    // const binOuterRadius = bin.c_max/thisView.bin_size.c*tileSize * thisView.bin_size.c_ring_width_ratio


    const binCenterRadius = bin.c_center/thisView.bin_size.c*tileSize * thisView.bin_size.c_ring_width_ratio

    
    const binRadialWidth = getTileScale(d) * getTileScale(d)* tileSize * (thisView.bin_size.c_ring_width_ratio - tileBorderSizeInBins)
    
    const binInnerRadius = binCenterRadius - binRadialWidth / 2
    const binOuterRadius = binCenterRadius + binRadialWidth / 2

    const halfAngle = (bin.h_max - bin.h_center) 
    const angleMargin = 0.5 * tileBorderSizeInBins * 360 / (2 * Math.PI * (bin.c_center * thisView.bin_size.c_ring_width_ratio / thisView.bin_size.c))
    const halfAngleWithMargin = halfAngle - angleMargin
    const halfAngleScaled = getTileScale(d) * halfAngleWithMargin
    const endAngleMargin = (bin.h_center - halfAngleScaled)
    const startAngleMargin = (bin.h_center + halfAngleScaled)
        

    const binInnerStartX = levelCenterX + binInnerRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
    const binInnerEndX = levelCenterX + binInnerRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
    const binInnerStartY = levelCenterY - binInnerRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
    const binInnerEndY = levelCenterY - binInnerRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)  

    const binOuterStartX = levelCenterX + binOuterRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
    const binOuterEndX = levelCenterX + binOuterRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
    const binOuterStartY = levelCenterY - binOuterRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
    const binOuterEndY = levelCenterY - binOuterRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI) 

    // do inner startX, startY -> inn
    return `
    M ${binInnerStartX} ${binInnerStartY} 
    A ${binInnerRadius} ${binInnerRadius} 0 0 1 ${binInnerEndX} ${binInnerEndY}
    L ${binOuterEndX} ${binOuterEndY}
    A ${binOuterRadius} ${binOuterRadius} 0 0 0 ${binOuterStartX} ${binOuterStartY}
    L ${binInnerStartX} ${binInnerStartY}
    `
}


export default FullColorBinView