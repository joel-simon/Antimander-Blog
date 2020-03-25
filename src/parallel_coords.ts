declare var d3: any;

export default function(
    div:HTMLElement,
    // data:number[][],
    data:any[],
    // names:string[],
    on_change:Function
) {
    // dimensionTitles: [...names, 'index'],
    // hideAxis: ['index']
    const parcoords = d3.parcoords()(div)
        .alpha(0.05)
        .data(data)
        // .data(data.map((v, i) => {
        //     const obj:object = { index: i }
        //     v.forEach((_v:number, _i:number) => obj[names[_i]] = _v)
        //     return obj
        // }))
        .color("#000")
        .composite("darker")
        .hideAxis(['index'])
        // .composite('darker')
        .render()
        .shadows()
        // .autoscale()
        .reorderable()
        .brushMode('1D-axes')  // enable brushing

    parcoords.on('brush', (values: any[]) => {
        if (values.length == 0) return
        on_change(values.map(o => o.index), values)
    })
    return parcoords
}
