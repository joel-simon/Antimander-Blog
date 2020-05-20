// declare var d3: any;
declare var window: any;
declare var ParCoords: any;
// import ParCoords from 'parcoord-es'


export default function(div:HTMLElement, data:any[], hidden_axes: string[], on_change:Function ) {
    const parcoords = (ParCoords()(div) as any)
        .data(data)
        .alpha(.05)
        .color("black")
        // .color("#F2BA00")
        // .color("#006200")
        // .brushedColor('black')
        // .shadows()
        // .alphaOnBrushed(.5)
        // .composite("darker")
        // .flipAxes(dims.slice(1))
        .hideAxis(hidden_axes.concat([ 'index' ]))        
        .render()
        .reorderable()
        .brushMode('1D-axes')  // enable brushing
        .on('brush', (values: any[]) => {            
            on_change(values.map(o => o.index), values)
        })
    return parcoords
}
