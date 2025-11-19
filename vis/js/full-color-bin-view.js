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
        const y_bin_offset = this[this.y_dim + "_max_bin"] + this.TILE_SEGMENT_MARGIN_NUM
        const y_bin_height =  y_bin_offset - this[this.y_dim + "_min_bin"] + this.TILE_SEGMENT_MARGIN_NUM

        const x_bin_offsets = {}
        let currXBinOffset = this.TILE_SEGMENT_MARGIN_NUM 
        let x_bin_width

        for(const [split_bin, ranges] of Object.entries(this.splitLevelRanges)){
            currXBinOffset = currXBinOffset - ranges[this.x_dim].min

            x_bin_offsets[split_bin] = currXBinOffset

            // adjust for positive direction
            currXBinOffset = currXBinOffset + ranges[this.x_dim].max + this.TILE_SEGMENT_MARGIN_NUM 
            
            // only the last one will be saved at the end, giving us total svg width
            x_bin_width = currXBinOffset
        }

        return {
            y_bin_offset: y_bin_offset,
            y_bin_height: y_bin_height,
            x_bin_offsets: x_bin_offsets,
            x_bin_width: x_bin_width
        }
    }

    setDisplayOffsets(display_offsets){
        this.display_offsets = display_offsets
    }


    createOrUpdateColorTiles(parentElement, backgroundColor){
        // todo: calculate
        const tileBorderSize = 1
        const tileSize = 5

        const [dim1, dim2, dim3] = this.bin_size.dims

        parentElement.selectAll(".tile")
            .data(this.bin_array)
            .join("rect")
            .attr("class", "tile")
            .style("stroke", backgroundColor)
            .style("stroke-width", d => tileBorderSize)
            .attr("x", (d) => {
                const x =  tileSize * 
                    (d[this.x_dim + "_bin"] + this.display_offsets.x_bin_offsets[d[this.split_dim + "_bin"]])
                if(isNaN(x)){
                    console.log("x is NAN")
                    debugger
                }
                return x
                })

            .attr("y", (d) => 
                tileSize * 
                (-d[this.y_dim + "_bin"] + this.display_offsets.y_bin_offset)
            )
            .attr("fill", (d) => {
                    return this.bin_size.type == "ring" ?
                    `oklch(${d.l_center} ${d.c_center} ${d.h_center})`
                    :
                    `oklab(${d.l_center} ${d.a_center} ${d.b_center})`
                })
            .attr("height", tileSize)
            .attr("width", tileSize)
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


export default FullColorBinView