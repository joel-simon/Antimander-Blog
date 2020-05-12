declare var d3: any;
declare var window: any;
export default function(div:HTMLElement, data:any[], hidden_axes: string[], on_change:Function ) {
    
    // Hack because .filAxes was giving issues.
    const dims = Object.keys(data[0])    
    data.forEach(row => {
        for (let dim of dims) {
            if (dim != 'index') {
                row[dim] *= -1
            }
        }
    })
    // console.log(dims, dims.slice(0, dims.length-1));
    
    const parcoords = d3.parcoords({
        alpha: .1
    })(div)
        .data(data)
        // .alpha(.1)
        .color("black")
        // .brushedColor('black')
        // .shadows()
        // .alphaOnBrushed(.5)
        // .composite("darker")
        // .flipAxes(dims.slice(1))
        .hideAxis(hidden_axes.concat([ 'index' ]))        
        .render()
        .reorderable()
        .brushMode('1D-axes')  // enable brushing

    parcoords.on('brush', (values: any[]) => {
        if (values.length == 0) {
            return
        }
        on_change(values.map(o => o.index), values)
    })
    window.pc = parcoords
    return parcoords
}
