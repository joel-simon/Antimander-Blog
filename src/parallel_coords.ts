declare var d3: any;
declare var window: any;
export default function(div:HTMLElement, data:any[], on_change:Function ) {
    const dimensions = {}
    // Object.keys(data[0]).forEach(name => {
    //     dimensions[name] = { orient:'right' }
    // })    
    const parcoords = d3.parcoords()(div)
        .data(data)
        .alpha(.1)
        .dimensions(dimensions)
        .color("black")
        // .brushedColor('black')
        // .shadows()
        // .alphaOnBrushed(.5)
        // .composite("darker")
        .hideAxis([ 'index' ])
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
