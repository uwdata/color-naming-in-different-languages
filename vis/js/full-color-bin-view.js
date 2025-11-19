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
        // TODO: ????

        this[dim1 + "_nums"] = []
        this[dim2 + "_nums"] = []
        this[dim3 + "_nums"] = []
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

            // track the range of bin numbers in each level
            const splitDimBinNum = bin[this.split_dim + "_bin"]
            if(!(splitDimBinNum in this.splitDimNums)){
                this.splitDimNums[splitDimBinNum] = {
                    [this.x_dim]: [],
                    [this.y_dim]: []
                }
            }
            const xDimNum = bin[this.x_dim + "_bin"]
            if(!(this.splitDimNums[splitDimBinNum][this.x_dim].includes(xDimNum))){
                this.splitDimNums[splitDimBinNum][this.x_dim].push(xDimNum)
            }
            const yDimNum = bin[this.y_dim + "_bin"]
            if(!(this.splitDimNums[splitDimBinNum][this.y_dim].includes(yDimNum))){
                this.splitDimNums[splitDimBinNum][this.y_dim].push(yDimNum)
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
                        (d[this.x_dim + "_bin"] + this.display_offsets.x_offsets_in_bins[d[this.split_dim + "_bin"]])
                    if(isNaN(x)){
                        console.log("x is NAN")
                        debugger
                    }
                    return x
                    })

                .attr("y", (d) => 
                    tileSize * 
                    (-d[this.y_dim + "_bin"] + this.display_offsets.y_offset_in_bins)
                )
                .attr("fill", (d) => {
                        return this.bin_size.type == "ring" ?
                        `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                        :
                        `oklab(${d.l_center} ${d.a_center} ${d.b_center})`
                    })
                .attr("height", tileSize)
                .attr("width", tileSize)
                .attr("title", (d) => {
                    // const [l,a,b] = curr_bin_size.type == "ring" ? [d.l_bin, d.c_bin, d.h_bin]: [d.l_bin, d.a_bin, d.b_bin]
                    // const bin_info = lab_bins[curr_bin_size][l][a][b]
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
                    .attr("cx", d =>  30 + (thisView["l_nums"].length - 1 - d.l_bin) * 100)
                    .attr("cy", d =>  70)
                    .attr("r",  d => {
                        //let bin = lab_bins[curr_bin_size][d.l_bin][d.c_bin][d.h_bin]
                        const binRadius = d.c_max/thisView.bin_size.c*tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1) - 0.5 * tileBorderSize
                        return binRadius
                    })
                    .attr("fill", d => {
                        //let bin = lab_bins[curr_bin_size][d.l_bin][d.c_bin][d.h_bin]
                        return `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                    })
                    // .attr("title", (d) => {
                    //     const [l,a,b] = curr_bin_size.type == "ring" ? [d.l_bin, d.c_bin, d.h_bin]: [d.l_bin, d.a_bin, d.b_bin]
                    //     const bin_info = lab_bins[curr_bin_size][l][a][b]
                    //     let info = `
                    //     ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
                    //     Bin Center (l, a, b): ${Math.round(bin_info.l_center *100, 1)/100}, ${Math.round(bin_info.a_center*100, 1)/100}, ${Math.round(bin_info.b_center*100, 1)/100}
                    //     Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
                    //     Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
                    //     ${("representative_rgb" in bin_info)
                    //         ?
                    //         `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
                    //         : ""
                    //     }`.trim()

                    //     return info
                    // })
                    


                parentElement.selectAll(".arc-tile")
                    .data(this.bin_array.filter(d => d.c_bin != 0))
                    .join("path")
                    .attr("class", "arc-tile")
                    .style("stroke", d => {
                        //let bin = lab_bins[curr_bin_size][d.l_bin][d.c_bin][d.h_bin]
                        return `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                    })
                    .attr("d", d => {
                        //let bin = lab_bins[curr_bin_size][d.l_bin][d.c_bin][d.h_bin]
                        const levelCenterX = 30 + (thisView["l_nums"].length - 1 - d.l_bin) * 100
                        const levelCenterY = 70
                        const binRadius = d.c_center/thisView.bin_size.c*thisView.bin_size.tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1)
                        const endAngleMargin = -(d.h_min + (thisView.bin_size.h_divs == 3 ? 8 : 5) / d.c_center * thisView.bin_size.c)
                        - 90 // rotate 90 degrees
                        const startAngleMargin = -(d.h_max - (thisView.bin_size.h_divs == 3 ? 8 : 5) / d.c_center * thisView.bin_size.c)
                        - 90 // rotate 90 degrees
                        const binStartDeltaX = binRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
                        const binStartX = levelCenterX + binStartDeltaX
                        const binEndDeltaX = binRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
                        const binEndX = levelCenterX  + binEndDeltaX
                        const binStartDeltaY = binRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
                        const binStartY = levelCenterY + binStartDeltaY
                        const binEndDeltaY = binRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)  
                        const binEndY = levelCenterY + binEndDeltaY

                        //let binX = d.h_bin*curr_bin_size.tileSize +l_bin_x_offsets[curr_bin_size][d.c_bin]
                        
                        return `
                        M ${binStartX} ${binStartY} 
                        A ${binRadius} ${binRadius} 0 0 1 ${binEndX} ${binEndY}
                        `
                    }) // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                    .style("stroke-width", tileSize * (thisView.bin_size.h_divs == 3 ? 0.5 : 1) - 1 * tileBorderSize)//d => curr_bin_size.tileBorderSize)
                    .attr("fill", "rgba(0,0,0,0)")
                    // .attr("title", (d) => {
                    //     const [l,a,b] = curr_bin_size.type == "ring" ? [d.l_bin, d.c_bin, d.h_bin]: [d.l_bin, d.a_bin, d.b_bin]
                    //     const bin_info = lab_bins[curr_bin_size][l][a][b]
                    //     let info = `
                    //     ${d.commonTerm ? `Max Prob. Term: ${d.commonTerm}` : ""}
                    //     Bin Center (l, a, b): ${Math.round(bin_info.l_center *100, 1)/100}, ${Math.round(bin_info.a_center*100, 1)/100}, ${Math.round(bin_info.b_center*100, 1)/100}
                    //     Bin Center (r, g, b): ${Math.round(bin_info.center_rgb.r, 1)}, ${Math.round(bin_info.center_rgb.g, 1)}, ${Math.round(bin_info.center_rgb.b, 1)}
                    //     Bin fraction valid rgb: ${bin_info.valid_rgb_ratio}
                    //     ${("representative_rgb" in bin_info)
                    //         ?
                    //         `Example RGB in tile (r, g, b): ${Math.round(bin_info.representative_rgb.r, 1)}, ${Math.round(bin_info.representative_rgb.g, 1)}, ${Math.round(bin_info.representative_rgb.b, 1)}` 
                    //         : ""
                    //     }`.trim()

                    //     return info
                    // })
            }
    }
}


export default FullColorBinView