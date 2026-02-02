// const isometric_x_angle = 30
// const isometric_y_angle = 150
// 120 -> 30
// 150 -> 60
// const isometric_x_angle = 300
// const isometric_y_angle = 240

// const isometric_x_angle = 330
// const isometric_y_angle = 210

const isometric_x_angle = 210
const isometric_y_angle = 330


// isometric radius distortions:
const isometric_y_radius = Math.sqrt(0.5) // 0.7071067811865475 
const isometric_x_radius = Math.sqrt(1.5) // 1.224744871391589

class FullColorBinView {
    constructor(options) {
        this.TILE_SEGMENT_LEVEL_MARGIN_NUM = 3 // 3 tiles worth between each "level", and 1/2 of this padding on all sides
        this.TILE_SEGMENT_OUTER_MARGIN_NUM = options.TILE_SEGMENT_OUTER_MARGIN_NUM ?  options.TILE_SEGMENT_OUTER_MARGIN_NUM : this.TILE_SEGMENT_LEVEL_MARGIN_NUM / 2
        this.bin_size = options.bin_size
        this.bin_array = options.bin_array
        this.nested_bins = this.binsArrayToNested(this.bin_array)
        this.x_dim_direction = options.x_dim.startsWith("-") ? -1 : 1
        this.x_dim = options.x_dim.replace("-", "")
        this.y_dim_direction = options.y_dim.startsWith("-") ? -1 : 1
        this.y_dim = options.y_dim.replace("-", "")
        this.split_dim = options.split_dim
        this.z_dim = options.z_dim

        if(this.z_dim){ // if z_dim (isometric view), need to sort
            this.isoSortBins()
        }

        this.findDimBounds()
    }

    isoSortBins(){
        this.bin_array = [...this.bin_array]
        this.bin_array.sort((a, b) => {
            const z_scale = this.z_dim == "l" ? this.bin_size.l_scale : 1

            const a_bin_dims = {
                l_bin: a.l_bin,
                a_bin: a.a_bin,
                b_bin: a.b_bin
            }
            const b_bin_dims = {
                l_bin: b.l_bin,
                a_bin: b.a_bin,
                b_bin: b.b_bin
            }
            if("c_bin" in a){
                a_bin_dims.l_bin = a.l_center
                b_bin_dims.l_bin = b.l_center
                if(a.c_bin == 0){
                    a_bin_dims.a_bin = 0
                    a_bin_dims.b_bin = 0
                } else {
                    a_bin_dims.a_bin = a.c_center * Math.cos(a.h_center / 360 * 2 * Math.PI)
                    a_bin_dims.b_bin = a.c_center * Math.sin(a.h_center / 360 * 2 * Math.PI)
                }
                if(b.c_bin == 0){
                    b_bin_dims.a_bin = 0
                    b_bin_dims.b_bin = 0
                } else {
                    b_bin_dims.a_bin = b.c_center * Math.cos(b.h_center / 360 * 2 * Math.PI)
                    b_bin_dims.b_bin = b.c_center * Math.sin(b.h_center / 360 * 2 * Math.PI)
                }
            }

            // let a_val = - a_bin_dims[this.x_dim + "_bin"] - a_bin_dims[this.y_dim + "_bin"] + z_scale* a_bin_dims[this.z_dim + "_bin"] 
            // let b_val = - b_bin_dims[this.x_dim + "_bin"] - b_bin_dims[this.y_dim + "_bin"] + z_scale* b_bin_dims[this.z_dim + "_bin"]
            // let a_val = - this.x_dim_direction * a_bin_dims[this.x_dim + "_bin"] - this.y_dim_direction * a_bin_dims[this.y_dim + "_bin"] + z_scale* a_bin_dims[this.z_dim + "_bin"] 
            // let b_val = - this.x_dim_direction * b_bin_dims[this.x_dim + "_bin"] - this.y_dim_direction * b_bin_dims[this.y_dim + "_bin"] + z_scale* b_bin_dims[this.z_dim + "_bin"]
            let a_val = a_bin_dims[this.x_dim + "_bin"] + a_bin_dims[this.y_dim + "_bin"] + z_scale* a_bin_dims[this.z_dim + "_bin"] 
            let b_val = b_bin_dims[this.x_dim + "_bin"] + b_bin_dims[this.y_dim + "_bin"] + z_scale* b_bin_dims[this.z_dim + "_bin"]
            return a_bin_dims[this.z_dim + "_bin"] != b_bin_dims[this.z_dim + "_bin"] ? 
                a_bin_dims[this.z_dim + "_bin"] - b_bin_dims[this.z_dim + "_bin"] :
                a_val - b_val
        })
    }

    setBinArray(bin_array){
        this.bin_array = bin_array
        this.nested_bins = this.binsArrayToNested(this.bin_array)
        if(this.z_dim){ // if z_dim (isometric view), need to sort
            this.isoSortBins()
        }
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

        // assume split_dim (this.split_dim)
        const splitLevelEdgesInTiles = {}

        for(const bin of this.bin_array){

            const splitDimBinNum = bin[this.split_dim + "_bin"]
            if(!(splitDimBinNum in splitLevelEdgesInTiles)){
                splitLevelEdgesInTiles[splitDimBinNum] = {
                    [this.x_dim]: [],
                    [this.y_dim]: []
                }
            }

            // track the range of bin edge numbers in each direction
            // (+1/2 -1/2 for the sides of the centered bin)
            if(!areRingArcs){ 

                // track the range of bin number distance in each level
                const xDimNum = bin[this.x_dim + "_bin"]
                if(!(splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].includes(xDimNum + 1/2))){
                    splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].push(xDimNum + 1/2)
                }
                if(!(splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].includes(xDimNum - 1/2))){
                    splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].push(xDimNum - 1/2)
                }
                const yDimNum = bin[this.y_dim + "_bin"]
                if(!(splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].includes(yDimNum + 1/2))){
                    splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].push(yDimNum + 1/2)
                } 
                if(!(splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].includes(yDimNum - 1/2))){
                    splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].push(yDimNum - 1/2)
                } 

            } else if(this.split_dim){ // arc bins
                
                // we assume split_dim is l, x/y dims are a/b, and that we have c/h data
                if(this.split_dim !== "l" || ![this.x_dim, this.y_dim].includes("a") ||
                   ![this.x_dim, this.y_dim].includes("b") || !("c_bin" in bin) || !("h_bin" in bin)){
                    throw new Error("Arc bin detected, but not expected dimensions of x/y dims: a/b, split dim: l, and bin c/h data")
                }

                // for each arc, consider the outermost line of the arc in the c
                // direction, and calculate the max x/y values of that max c line

                if(bin.c_center == 0){ // bin at center is a circle at x/y 0, then min/max of x/y is c_max
                    if(!(splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].includes(bin.c_max))){
                        splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].push(bin.c_max)
                    }
                    if(!(splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].includes(-bin.c_max))){
                        splitLevelEdgesInTiles[splitDimBinNum][this.x_dim].push(-bin.c_max)
                    }
                    if(!(splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].includes(bin.c_max))){
                        splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].push(bin.c_max)
                    } 
                    if(!(splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].includes(-bin.c_max))){
                        splitLevelEdgesInTiles[splitDimBinNum][this.y_dim].push(-bin.c_max)
                    } 
                } else { // arc, not a circle at the center
                    // sine starts goes 0 -> 1 -> 0 -> -1
                    // cosine goes 1 -> 0 -> -1 -> 0
                    // a goes with cosine, b goes with sine

                    let a_min, b_min, a_max, b_max
                    
                    // a max (h 0 degrees, a+ / b0)
                    // if h overlaps with 0, then max a is just "c"
                    if(bin.h_min > bin.h_max || [0,360].includes(bin.h_min) || [0,360].includes(bin.h_max)){
                        a_max = arcCToABRadiusCorrection * bin.c_max
                    } else{
                        a_max = arcCToABRadiusCorrection * bin.c_max * Math.max(
                            Math.cos(bin.h_min / 360 * 2* Math.PI),
                            Math.cos(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // b max (90 degrees is b+ / a0)
                    if(bin.h_min <= 90 && bin.h_max >= 90){
                        b_max = arcCToABRadiusCorrection * bin.c_max
                    } else{
                        b_max = arcCToABRadiusCorrection * bin.c_max * Math.max(
                            Math.sin(bin.h_min / 360 * 2* Math.PI),
                            Math.sin(bin.h_max / 360 * 2* Math.PI)
                        )
                    }
                    
                    // a min (180 degrees is a- / b0)
                    if(bin.h_min <= 180 && bin.h_max >= 180){
                        a_min = arcCToABRadiusCorrection * -bin.c_max
                    } else{
                        a_min = arcCToABRadiusCorrection * bin.c_max * Math.min(
                            Math.cos(bin.h_min / 360 * 2* Math.PI),
                            Math.cos(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // b min 270 degrees is b- / a0
                    if(bin.h_min <= 270 && bin.h_max >= 270){
                        b_min = arcCToABRadiusCorrection * -bin.c_max
                    } else{
                        b_min = arcCToABRadiusCorrection * bin.c_max * Math.max(
                            Math.sin(bin.h_min / 360 * 2* Math.PI),
                            Math.sin(bin.h_max / 360 * 2* Math.PI)
                        )
                    }

                    // track the range of bin numbers in each level
                    const splitDimBinNum = bin[this.split_dim + "_bin"]

                    // update a/b values with mins and maxes
                    if(!(splitLevelEdgesInTiles[splitDimBinNum].a.includes(a_min))){
                        splitLevelEdgesInTiles[splitDimBinNum].a.push(a_min)
                    }
                    if(!(splitLevelEdgesInTiles[splitDimBinNum].a.includes(a_max))){
                        splitLevelEdgesInTiles[splitDimBinNum].a.push(a_max)
                    }
                    if(!(splitLevelEdgesInTiles[splitDimBinNum].b.includes(b_min))){
                        splitLevelEdgesInTiles[splitDimBinNum].b.push(b_min)
                    }
                    if(!(splitLevelEdgesInTiles[splitDimBinNum].b.includes(b_max))){
                        splitLevelEdgesInTiles[splitDimBinNum].b.push(b_max)
                    }
                }
            } else { // 3D bins
                // TODO: calculate 3D bin min/maxes
                // and no need for split levels
            }         
        } 

        this.splitLevelRanges = {}

        for(const [splitDimBinNum, edgeValues] of Object.entries(splitLevelEdgesInTiles)){

            // find min/max x/y vals for this level
            const minLevelX =  Math.min(...edgeValues[this.x_dim])
            const maxLevelX =  Math.max(...edgeValues[this.x_dim])
            const minLevelY =  Math.min(...edgeValues[this.y_dim])
            const maxLevelY =  Math.max(...edgeValues[this.y_dim])

            // fill in splitLevelRanges
            this.splitLevelRanges[splitDimBinNum] = {
                [this.x_dim]: {
                    min: minLevelX,
                    max: maxLevelX
                },
                [this.y_dim]: {
                    min: minLevelY,
                    max: maxLevelY
                }
            }

            // update overall "this" x/y min/max values

            // make sure x/y min/max values are set in "this"
            if(!((this.x_dim + "_min_in_bins") in this)){
                this[this.x_dim + "_min_in_bins"] = minLevelX
            }
            if(!((this.x_dim + "_max_in_bins") in this)){
                this[this.x_dim + "_max_in_bins"] = maxLevelX
            }
            if(!((this.y_dim + "_min_in_bins") in this)){
                this[this.y_dim + "_min_in_bins"] = minLevelY
            }
            if(!((this.y_dim + "_max_in_bins") in this)){
                this[this.y_dim + "_max_in_bins"] = maxLevelY
            }

            // update x/y min/max values if we've found a more min/max one
            if(minLevelX < this[this.x_dim + "_min_in_bins"]){
                this[this.x_dim + "_min_in_bins"] = minLevelX
            }
            if(maxLevelX > this[this.x_dim + "_max_in_bins"]){
                this[this.x_dim + "_max_in_bins"] = maxLevelX
            }
            if(minLevelY < this[this.y_dim + "_min_in_bins"]){
                this[this.y_dim + "_min_in_bins"] = minLevelY
            }
            if(maxLevelY > this[this.y_dim + "_max_in_bins"]){
                this[this.y_dim + "_max_in_bins"] = maxLevelY
            }           
        }
    }

    getDisplayOffsets(){
        if(this.split_dim){
            // for now only assume l is used for y scale
            const y_scale = this.y_dim == "l" ? this.bin_size.l_scale : 1

            const y_offset_in_bins = 
                (
                    this[this.y_dim + (this.y_dim_direction > 0 ? "_max_in_bins" : "_min_in_bins")] * this.y_dim_direction  
                ) * y_scale 
                + this.TILE_SEGMENT_OUTER_MARGIN_NUM
            const y_height_in_bins =  y_offset_in_bins - 
                (
                    this[this.y_dim + (this.y_dim_direction > 0 ? "_min_in_bins" : "_max_in_bins")] * this.y_dim_direction  
                ) * y_scale 
                + this.TILE_SEGMENT_OUTER_MARGIN_NUM

            console.log("y_offset_in_bins", y_offset_in_bins, "y_height_in_bins", y_height_in_bins)

            const x_offsets_in_bins = {}
            let currXBinOffset = this.TILE_SEGMENT_OUTER_MARGIN_NUM 
            let x_width_in_bins

            for(const [split_bin, ranges] of Object.entries(this.splitLevelRanges)){
                currXBinOffset = currXBinOffset 
                    - ranges[this.x_dim][this.x_dim_direction > 0 ? "min" : "max"] * this.x_dim_direction

                x_offsets_in_bins[split_bin] = currXBinOffset

                // adjust for positive direction
                currXBinOffset = currXBinOffset 
                    + ranges[this.x_dim][this.x_dim_direction > 0 ? "max" : "min"] * this.x_dim_direction
                    + this.TILE_SEGMENT_LEVEL_MARGIN_NUM 
                
                // only the last one will be saved at the end, giving us total svg width
                x_width_in_bins = currXBinOffset
            }

            // remove final inner margin and add the outer margin
            x_width_in_bins = x_width_in_bins - this.TILE_SEGMENT_LEVEL_MARGIN_NUM + this.TILE_SEGMENT_OUTER_MARGIN_NUM
            
            return {
                y_offset_in_bins: y_offset_in_bins,
                y_height_in_bins: y_height_in_bins,
                x_offsets_in_bins: x_offsets_in_bins,
                x_width_in_bins: x_width_in_bins
            }
        }else {
            const z_scale = this.z_dim == "l" ? this.bin_size.l_scale : 1
            for(const bin in this.bin_array){

            }
            return {
                y_offset_in_bins: y_offset_in_bins,
                y_height_in_bins: y_height_in_bins,
                x_offset_in_bins: x_offset_in_bins,
                x_width_in_bins: x_width_in_bins
            }
        }
    }

    setDisplayOffsets(display_offsets){
        this.display_offsets = display_offsets
    }


    createOrUpdateColorTiles(parentElement, options){
        // for now only assume l is used for y scale
        const y_scale = this.y_dim == "l" ? this.bin_size.l_scale : 1
        const z_scale = this.z_dim == "l" ? this.bin_size.l_scale : 1

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

        const getTileVisibleDisplay = "getTileVisible" in options ? 
            (d) => options.getTileVisible(d) ? undefined : "none"
            : undefined


        const thisView = this;
        const displayWidth = parentElement.attr("width")
        
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
                    .attr("x1", (d) => 
                        tileSize * (
                            d[1] 
                            + thisView.splitLevelRanges[d[0]][thisView.x_dim][thisView.x_dim_direction > 0 ? "max" : "min"] * this.x_dim_direction
                            + thisView.TILE_SEGMENT_OUTER_MARGIN_NUM 
                        ))
                    .attr("y1", (d) => 
                        tileSize * (
                            thisView.display_offsets.y_offset_in_bins 
                            - thisView[thisView.y_dim + (thisView.y_dim_direction > 0 ? "_max_in_bins" : "_min_in_bins")] * thisView.y_dim_direction * y_scale 
                            - 0.5
                        ))
                    .attr("x2", (d) => 
                        tileSize * (
                            d[1] 
                            + thisView.splitLevelRanges[d[0]][thisView.x_dim][thisView.x_dim_direction > 0 ? "max" : "min"] * this.x_dim_direction 
                            + thisView.TILE_SEGMENT_OUTER_MARGIN_NUM
                        ))
                    .attr("y2", (d)=> 
                        tileSize * (
                            thisView.display_offsets.y_offset_in_bins 
                            - thisView[thisView.y_dim + (thisView.y_dim_direction > 0 ? "_min_in_bins" : "_max_in_bins")] * thisView.y_dim_direction * y_scale 
                            + 0.5
                        ))
                    .style("stroke", "oklch(70% 0 0 / .5)")
                    .style("stroke-width", tileBorderSize*2)
                    .style("display", (d) => d[0] ==  ""+thisView[thisView.split_dim+"_max_in_bins"] ? "none" : "") 
        } else {
            parentElement.selectAll(".level-outline")
                .data([])
                .join("line")
        }

        const areRingArcs = [this.x_dim, this.y_dim].includes("a") && [dim1, dim2, dim3].includes("h")

        if(!areRingArcs && this.split_dim){ // regular square or rectangle bins, split along an axis

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
                .style("display", getTileVisibleDisplay)
                .style("stroke", options.no_border ? "" : backgroundColor)
                .style("stroke-width", options.no_border ? "" :  tileBorderSize/2)
                .attr("x", (d) => {
                    const bin = thisView.getBinInfo(d)
                    const x =  tileSize * 
                        (this.x_dim_direction * bin[thisView.x_dim + "_bin"] // relative position
                            - getTileScale(d) / 2  // minus width/2 for centering
                            + thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]]) // general y position
                    return x
                    })

                .attr("y", (d) => {
                    const bin = thisView.getBinInfo(d)
                    return tileSize *
                        (- this.y_dim_direction * bin[thisView.y_dim + "_bin"] * y_scale // relative position
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
        } else if(!areRingArcs && this.z_dim){ // isometric square or rectangle bins
            // clear any old arc or circle tiles
            parentElement.selectAll(".arc-tile")
                .data([])
                .join("path")
            parentElement.selectAll(".circle-tile")
                .data([])
                .join("path")

            let tiles = parentElement.selectAll(".tile")
                .data(binsToDisplay)
                //.join("rect")
                .join("path")
                .attr("class", "tile")
                .style("display", getTileVisibleDisplay)
                .style("stroke", options.no_border ? "" : backgroundColor)
                .style("stroke-width", options.no_border ? "" :  tileBorderSize/2)
                .attr("fill", (d) => {
                    const bin = thisView.getBinInfo(d)
                    return getTileColor(d, bin)
                })
                .attr("d", d => {
                    const bin = thisView.getBinInfo(d)

                    const tileScale = getTileScale(d)
                    
                    const [raw_center_x, raw_center_y] = getIsometricBinPosition(thisView, bin, tileScale)
                    const [center_x, center_y] = [
                        raw_center_x -  (z_scale) * tileScale / 2 
                            +150 / tileSize ,
                         raw_center_y - (z_scale) * tileScale / 2 
                            +250 / tileSize]
                     

                    console.log("TODO: Generalize to use x_dim and y_dim")
                    // TODO: Generalize to use x_dim and y_dim
                    // 
                    // this.x_dim_direction
                    const l_min_y = ((z_scale) * getTileScale(d) / 2);
                    const l_max_y = -((z_scale) * getTileScale(d) / 2);
                    const a_min_x =  Math.max(
                            Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                            -Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const a_max_x =  Math.min(
                            Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                            -Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const a_min_y = Math.max(
                        Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const a_max_y = Math.min(
                        Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const b_min_x = Math.min(
                        Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const b_max_x = Math.max(
                        Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const b_min_y = Math.max(
                        Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    const b_max_y = Math.min(
                        Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2,
                        -Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const a_min_x =  -Math.abs(Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const a_max_x =  Math.abs(Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const a_min_y =  Math.abs(Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const a_max_y =  -Math.abs(Math.sin(isometric_x_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const b_min_x =  -Math.abs(Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const b_max_x =  Math.abs(Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const b_min_y =  Math.abs(Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    // const b_max_y =  -Math.abs(Math.sin(isometric_y_angle / 360 * 2 * Math.PI) * getTileScale(d) / 2)
                    
                    return `
                        M ${tileSize*(center_x +  a_min_x + b_max_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_max_y)} 
                        L ${tileSize*(center_x +  a_max_x + b_max_x)} ${tileSize*(center_y +l_max_y + a_max_y + b_max_y)} 
                        L ${tileSize*(center_x +  a_max_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_max_y + b_min_y)} 
                        L ${tileSize*(center_x +  a_min_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_min_y)}
                        L ${tileSize*(center_x +  a_min_x + b_max_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_max_y)}
                        
                        M ${tileSize*(center_x +  a_min_x + b_max_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_max_y)} 
                        L ${tileSize*(center_x +  a_min_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_min_y)}
                        L ${tileSize*(center_x +  a_min_x + b_min_x)} ${tileSize*(center_y +l_min_y + a_min_y + b_min_y)}
                        L ${tileSize*(center_x +  a_min_x + b_max_x)} ${tileSize*(center_y +l_min_y + a_min_y + b_max_y)}
                        L ${tileSize*(center_x +  a_min_x + b_max_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_max_y)}

                        M ${tileSize*(center_x +  a_max_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_max_y + b_min_y)} 
                        L ${tileSize*(center_x +  a_min_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_min_y + b_min_y)} 
                        L ${tileSize*(center_x +  a_min_x + b_min_x)} ${tileSize*(center_y +l_min_y + a_min_y + b_min_y)} 
                        L ${tileSize*(center_x +  a_max_x + b_min_x)} ${tileSize*(center_y +l_min_y + a_max_y + b_min_y)} 
                        L ${tileSize*(center_x +  a_max_x + b_min_x)} ${tileSize*(center_y +l_max_y + a_max_y + b_min_y)} 
                         `
                })

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
        } else if(areRingArcs && this.split_dim){ // ring arcs split along the split_dim axis
            // clear any old square tiles
            parentElement.selectAll(".tile")
                .data([])
                .join("rect")

            const circleTiles = parentElement.selectAll(".circle-tile")
                .data(binsToDisplay.filter(d => ("binC" in d && d.binC == 0) || d.c_bin == 0))
                .join("circle")
                .attr("class", "circle-tile")
                .style("display", getTileVisibleDisplay)
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
                .style("display", getTileVisibleDisplay)
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
        } else { // isometric arc bins

            // clear any old circle or arc tiles
            parentElement.selectAll(".arc-tile")
                .data([])
                .join("path")
            parentElement.selectAll(".circle-tile")
                .data([])
                .join("path")


            let tiles = parentElement.selectAll(".tile")
                .data(binsToDisplay)
                .join("path")
                .attr("class", "tile")
                .style("display", getTileVisibleDisplay)
                .style("stroke", options.no_border ? "" : backgroundColor)
                .style("stroke-width", options.no_border ? "" :  tileBorderSize/2)
                .attr("fill", (d) => {
                    const bin = thisView.getBinInfo(d)
                    return getTileColor(d, bin)
                })
                .attr("d", d => {
                    return getIsometricArcBinPath(d, thisView, tileSize, tileBorderSizeInBins, getTileScale)
                })

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
        }
        return{
            tileSize: tileSize,
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
        
    const binStartDeltaA = binRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
    const binEndDeltaA = binRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
    const binStartDeltaB = binRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
    const binEndDeltaB = binRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)  

    const binPoints = {
        binStart_a: binStartDeltaA,
        binEnd_a: binEndDeltaA,
        binStart_b: binStartDeltaB,
        binEnd_b: binEndDeltaB,
    }

    const arcDirection = thisView.x_dim_direction * thisView.y_dim_direction > 0 ? 0 : 1

    return `
    M ${levelCenterX + thisView.x_dim_direction * binPoints["binStart_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binStart_"+thisView.y_dim]} 
    A ${binRadius} ${binRadius} 0 0 ${arcDirection} ${levelCenterX + thisView.x_dim_direction * binPoints["binEnd_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binEnd_"+thisView.y_dim]}
    `
}

function getArcPathArea(d, thisView, tileSize, tileBorderSizeInBins, getTileScale){
    const bin = thisView.getBinInfo(d)
    const levelCenterX = tileSize* thisView.display_offsets.x_offsets_in_bins[bin[thisView.split_dim + "_bin"]] 
    const levelCenterY =   tileSize* thisView.display_offsets.y_offset_in_bins

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
        

    const binPoints = {
        binInnerStart_a: binInnerRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI),
        binInnerEnd_a: binInnerRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI),
        binInnerStart_b: binInnerRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI),
        binInnerEnd_b: binInnerRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI),  

        binOuterStart_a: binOuterRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI),
        binOuterEnd_a:  binOuterRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI),
        binOuterStart_b: binOuterRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI),
        binOuterEnd_b: binOuterRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)

    }

    const arcDirection1 = thisView.x_dim_direction * thisView.y_dim_direction > 0 ? 0 : 1
    const arcDirection2 = thisView.x_dim_direction * thisView.y_dim_direction > 0 ? 1 : 0
    
    // do inner startX, startY -> inn
    return `
    M ${levelCenterX + thisView.x_dim_direction * binPoints["binInnerStart_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binInnerStart_"+thisView.y_dim]} 
    A ${binInnerRadius} ${binInnerRadius} 0 0 ${arcDirection1} ${levelCenterX + thisView.x_dim_direction * binPoints["binInnerEnd_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binInnerEnd_"+thisView.y_dim]}
    L ${levelCenterX + thisView.x_dim_direction * binPoints["binOuterEnd_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binOuterEnd_"+thisView.y_dim]}
    A ${binOuterRadius} ${binOuterRadius} 0 0 ${arcDirection2} ${levelCenterX + thisView.x_dim_direction * binPoints["binOuterStart_"+thisView.x_dim]} ${levelCenterY + - thisView.y_dim_direction * binPoints["binOuterStart_"+thisView.y_dim]}
    L ${levelCenterX + thisView.x_dim_direction * binPoints["binInnerStart_"+thisView.x_dim]} ${levelCenterY + thisView.y_dim_direction * - binPoints["binInnerStart_"+thisView.y_dim]} 
    `
}

function getIsometricArcBinPath(d, binView, tileSize, tileBorderSizeInBins, getTileScale){
    const bin = binView.getBinInfo(d)

    const tileScale = getTileScale(d)
    const z_scale = binView.z_dim == "l" ? binView.bin_size.l_scale : 1

    //const [raw_center_x, raw_center_y] = getIsometricBinPosition(thisView, bin, getTileScale(d))
    const [center_x, center_y] = [
        //raw_center_x + 30, 
        100, // x always same center 
        - bin[binView.z_dim + "_bin"] * z_scale * tileSize + 250 // assumes z_dim is L
        //raw_center_y * tileScale + 30 
        ]

    const l_min_y = ((z_scale) * tileScale / 2);
    const l_max_y = -((z_scale) * tileScale / 2);

    const binCenterRadius = bin.c_center/binView.bin_size.c*tileSize * binView.bin_size.c_ring_width_ratio

    
    const binRadialWidth = tileScale * tileScale* tileSize * (binView.bin_size.c_ring_width_ratio - tileBorderSizeInBins)
    
    if(("binC" in bin && bin.binC == 0) || bin.c_bin == 0){

        const binRadius = tileScale * (bin.c_max/binView.bin_size.c - 0.5 * tileBorderSizeInBins)*tileSize * binView.bin_size.c_ring_width_ratio 

        return `
            M ${center_x - isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize} 
            A ${isometric_x_radius * binRadius} ${isometric_y_radius * binRadius} 0 0 1 ${center_x + isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize}
            A ${isometric_x_radius * binRadius} ${isometric_y_radius * binRadius} 0 0 1 ${center_x - isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize}

            M ${center_x - isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize} 
            A ${isometric_x_radius * binRadius} ${isometric_y_radius * binRadius} 0 0 0 ${center_x + isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize}
            L ${center_x + isometric_x_radius * binRadius} ${center_y + l_min_y*tileSize}
            A ${isometric_x_radius * binRadius} ${isometric_y_radius * binRadius} 0 0 1 ${center_x - isometric_x_radius * binRadius} ${center_y + l_min_y*tileSize}
            L ${center_x - isometric_x_radius * binRadius} ${center_y + l_max_y*tileSize}
            `

    }

    const binInnerRadius = binCenterRadius - binRadialWidth / 2
    const binOuterRadius = binCenterRadius + binRadialWidth / 2

    const halfAngle = (bin.h_max - bin.h_center) 
    const angleMargin = 0.5 * tileBorderSizeInBins * 360 / (2 * Math.PI * (bin.c_center * binView.bin_size.c_ring_width_ratio / binView.bin_size.c))
    const halfAngleWithMargin = halfAngle - angleMargin
    const halfAngleScaled = getTileScale(d) * halfAngleWithMargin
    const endAngleMargin = (bin.h_center - halfAngleScaled)
    const startAngleMargin = (bin.h_center + halfAngleScaled)
        

    const binInnerStartX = binInnerRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI)  
    const binInnerEndX = binInnerRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
    const binInnerStartY = binInnerRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
    const binInnerEndY = binInnerRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI)  

    const binOuterStartX = binOuterRadius * Math.cos(startAngleMargin / 360 * 2 * Math.PI) 
    const binOuterEndX = binOuterRadius * Math.cos(endAngleMargin / 360 * 2 * Math.PI)
    const binOuterStartY = binOuterRadius* Math.sin(startAngleMargin / 360 * 2 * Math.PI)
    const binOuterEndY = binOuterRadius* Math.sin(endAngleMargin / 360 * 2 * Math.PI) 


    // Now convert to isometric X and Y
    const isoBinInnerStartX =  
        -binInnerStartX * Math.cos(isometric_x_angle / 360 * 2 * Math.PI) +
        -binInnerStartY * Math.cos(isometric_y_angle / 360 * 2 * Math.PI)
    const isoBinInnerStartY = 
        binInnerStartX * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) +
        binInnerStartY * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 

    const isoBinInnerEndX = 
        -binInnerEndX * Math.cos(isometric_x_angle / 360 * 2 * Math.PI) +
        -binInnerEndY * Math.cos(isometric_y_angle / 360 * 2 * Math.PI)
    const isoBinInnerEndY = 
        binInnerEndX * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) +
        binInnerEndY * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 

    const isoBinOuterStartX =  
        -binOuterStartX * Math.cos(isometric_x_angle / 360 * 2 * Math.PI) +
        -binOuterStartY * Math.cos(isometric_y_angle / 360 * 2 * Math.PI)
    const isoBinOuterStartY = 
        binOuterStartX * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) +
        binOuterStartY * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 

    const isoBinOuterEndX = 
        -binOuterEndX * Math.cos(isometric_x_angle / 360 * 2 * Math.PI) +
        -binOuterEndY * Math.cos(isometric_y_angle / 360 * 2 * Math.PI)
    const isoBinOuterEndY = 
        binOuterEndX * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) +
        binOuterEndY * - Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 

    
    // for each of the possible 4 sides, figure out if it should be displayed, and then display it
    // sides:
    //  innerStart -> innerEnd
    //  innerEnd -> outerEnd
    //  outerEnd -> outerStart
    //  outersStart -> innerStart
    return `
        M ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize  + isoBinInnerStartY} 
        A ${isometric_x_radius * binInnerRadius} ${isometric_x_radius * binInnerRadius} 0 0 0 ${center_x + isoBinInnerEndX} ${center_y + l_max_y*tileSize + isoBinInnerEndY}
        L ${center_x + isoBinOuterEndX} ${center_y + l_max_y*tileSize + isoBinOuterEndY}
        A ${isometric_x_radius * binOuterRadius} ${isometric_x_radius * binOuterRadius} 0 0 1 ${center_x + isoBinOuterStartX} ${center_y + l_max_y*tileSize + isoBinOuterStartY}
        L ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize + isoBinInnerStartY}
        ${ // innerStart -> innerEnd edge
            isoBinInnerStartX > isoBinInnerEndX ? 
            `
                M ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize  + isoBinInnerStartY} 
                A ${isometric_x_radius * binInnerRadius} ${isometric_x_radius * binInnerRadius} 0 0 0 ${center_x + isoBinInnerEndX} ${center_y + l_max_y*tileSize + isoBinInnerEndY}
                L ${center_x + isoBinInnerEndX} ${center_y + l_min_y*tileSize + isoBinInnerEndY}
                A ${isometric_x_radius * binOuterRadius} ${isometric_x_radius * binOuterRadius} 0 0 1 ${center_x + isoBinInnerStartX} ${center_y + l_min_y*tileSize + isoBinInnerStartY}
                L ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize + isoBinInnerStartY}
            `:
            ""
        }
        ${ // innerEnd -> outerEnd edge
            isoBinInnerEndX > isoBinOuterEndX ? 
            `
                M ${center_x + isoBinInnerEndX} ${center_y + l_max_y*tileSize + isoBinInnerEndY} 
                L ${center_x + isoBinOuterEndX} ${center_y + l_max_y*tileSize + isoBinOuterEndY}
                L ${center_x + isoBinOuterEndX} ${center_y + l_min_y*tileSize + isoBinOuterEndY}
                L ${center_x + isoBinInnerEndX} ${center_y + l_min_y*tileSize + isoBinInnerEndY}
                L ${center_x + isoBinInnerEndX} ${center_y + l_max_y*tileSize + isoBinInnerEndY}
            `:
            ""
        }
        ${ // outerEnd -> outerStart edge
            isoBinOuterEndX > isoBinOuterStartX ? 
            `
                M ${center_x + isoBinOuterStartX} ${center_y + l_max_y*tileSize  + isoBinOuterStartY} 
                A ${isometric_x_radius * binOuterRadius} ${isometric_x_radius * binOuterRadius} 0 0 0 ${center_x + isoBinOuterEndX} ${center_y + l_max_y*tileSize + isoBinOuterEndY}
                L ${center_x + isoBinOuterEndX} ${center_y + l_min_y*tileSize + isoBinOuterEndY}
                A ${isometric_x_radius * binOuterRadius} ${isometric_x_radius * binOuterRadius} 0 0 1 ${center_x + isoBinOuterStartX} ${center_y + l_min_y*tileSize + isoBinOuterStartY}
                L ${center_x + isoBinOuterStartX} ${center_y + l_max_y*tileSize + isoBinOuterStartY}
            `:
            ""
        }
        ${ // outersStart -> innerStart edge
             isoBinOuterStartX > isoBinInnerStartX ? 
            `
                M ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize + isoBinInnerStartY} 
                L ${center_x + isoBinOuterStartX} ${center_y + l_max_y*tileSize + isoBinOuterStartY}
                L ${center_x + isoBinOuterStartX} ${center_y + l_min_y*tileSize + isoBinOuterStartY}
                L ${center_x + isoBinInnerStartX} ${center_y + l_min_y*tileSize + isoBinInnerStartY}
                L ${center_x + isoBinInnerStartX} ${center_y + l_max_y*tileSize + isoBinInnerStartY}
            `:
            ""
        }
    `
}


function getIsometricBinPosition(binView, bin){
    const z_scale = binView.z_dim == "l" ? binView.bin_size.l_scale : 1
    let bin_lab_dims = {
        l_bin: bin.l_bin,
        a_bin: bin.a_bin,
        b_bin: bin.b_bin
    }
    if("c_bin" in bin){
        bin_lab_dims.l_bin = bin.l_center
        if(bin.c_bin == 0){
            bin_lab_dims.a_bin = 0
            bin_lab_dims.b_bin = 0
        } else {
            bin_lab_dims.a_bin = bin.c_center * Math.cos(bin.h_center / 360 * 2 * Math.PI)
            bin_lab_dims.b_bin = bin.c_center * Math.sin(bin.h_center / 360 * 2 * Math.PI)
        }
    }

    const center_x = //bin[thisView.x_dim + "_bin"] // relative position
        Math.cos(isometric_x_angle / 360 * 2 * Math.PI) * bin_lab_dims[binView.x_dim + "_bin"] +
        Math.cos(isometric_y_angle / 360 * 2 * Math.PI) * bin_lab_dims[binView.y_dim + "_bin"]
        //+30
    const center_y = //-bin[thisView.y_dim + "_bin"] * z_scale // relative position
            - bin_lab_dims[binView.z_dim + "_bin"] * z_scale
            -  bin_lab_dims[binView.x_dim + "_bin"] * Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 
            -  bin_lab_dims[binView.y_dim + "_bin"] * Math.sin(isometric_y_angle / 360 * 2 * Math.PI) 
            // - binView.x_dim_direction * bin_lab_dims[binView.x_dim + "_bin"] * Math.sin(isometric_x_angle / 360 * 2 * Math.PI) 
            // - binView.y_dim_direction * bin_lab_dims[binView.y_dim + "_bin"] * Math.sin(isometric_y_angle / 360 * 2 * Math.PI) 
               // +30

    return [center_x, center_y]
}


export default FullColorBinView