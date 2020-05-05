declare var d3: any;
declare var window: any;
export default function(div:HTMLElement, data:any[], hidden_axes: string[], on_change:Function ) {
    // const dimensions = {}
    const parcoords = d3.parcoords()(div)
        .data(data)
        .alpha(.1)
        // .dimensions(dimensions)
        .color("black")
        // .brushedColor('black')
        // .shadows()
        // .alphaOnBrushed(.5)
        // .composite("darker")
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
