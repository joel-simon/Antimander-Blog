import '../src/style.scss'
import { image_data } from './utils'
import ndarray from 'ndarray'
import Regl from 'regl'
import bind_parcoords from './parallel_coords'
import { fetch_json, sum, sample, range, clamp, inView } from './utils'
import { draw_districts } from './draw_command'

const canvas = document.querySelector('canvas')
const regl = Regl({
    canvas,
    extensions: [ 'oes_texture_float' ],
    attributes: { antialias: true },
    onDone: main
})

function update_scroll_blocks(scroll_blocks) {
    for (const block of scroll_blocks) {
        const { top, height } = block.getBoundingClientRect()
        const y_perc = (top+height/2) / window.innerHeight
        block.style.opacity = 1.0 - clamp(Math.abs(y_perc - 0.5)*2, 0, 1)
    }
}

async function bind_viewer(datapath: string, viewer_row: HTMLElement) {
    console.log('Loading', datapath)
    const r = 2048
    const nx = 5
    const ny = 5

    const viewer:HTMLElement = viewer_row.querySelector('.district-viewer')
    const scroll_blocks = viewer_row.querySelectorAll('.scroll_block')

    const [ map_data, rundata, statedata ]:[ any, RunData, StateData ] = await Promise.all([
        image_data(`./data/${datapath}/wards.png`),
        fetch_json(`./data/${datapath}/rundata.json`),
        fetch_json(`./data/${datapath}/statedata.json`)
    ])

    const { config, values, solutions, metrics_data } = rundata

    const value_objs = values.map((v, i) => {
        const obj:object = { index: i }
        v.forEach((_v:number, _i:number) => obj[config.metrics[_i]] = _v)
        return obj
    })

    // console.log(statedata);

    const viewer_height = viewer_row.clientHeight
    const draw = draw_districts( regl, map_data, statedata )
    let current = sample(range(solutions.length), nx*ny)
    let needs_draw = true

    const parcoords = bind_parcoords(
        viewer_row.querySelector('.parcoords'),
        value_objs,
        (indexes: number[]) => {
            if (current.length == 1) {
                parcoords.unhighlight()
            }
            current = sample(indexes, nx*ny)
            needs_draw = true
        }
    )

    const onClick = (x: number, y:number) => {
        if (current.length == 1) {
            current = sample(range(solutions.length), nx*ny)
            parcoords.unhighlight()
            draw(nx, ny, current.map(i => solutions[i]))
        } else {
            const c_i = Math.floor((x / canvas.clientWidth) * nx)
            const c_j = Math.floor((y / canvas.clientHeight) * ny)
            current = [ current[ (c_i*nx) + c_j ] ]
            parcoords.highlight([value_objs[current[0]]])
            draw(1, 1, current.map(i => solutions[i]))
        }
    }

    const onScroll = () => {
        const { top, bottom, height } = viewer_row.getBoundingClientRect()
        const stick_top_point = 0
        viewer.style.position = 'fixed'
        if (bottom < window.innerHeight) {
            viewer.style.top = (bottom - window.innerHeight) + 'px'
        } else if (top < stick_top_point) {
            // Stuck to view.
            viewer.style.top = stick_top_point+'px'
        } else {
            // Scroll normally when below.
            viewer.style.top = top + 'px'
        }
        update_scroll_blocks(scroll_blocks)
    }

    const onResize = () => {
        parcoords.width(viewer.clientWidth)
        parcoords.resize()
        parcoords.render()
    }

    const onStep = (force=false) => {
        if (needs_draw || force) {
            if (current.length == 1) {
                draw(1, 1, current.map(i => solutions[i]))
            } else if (current.length < 4) {
                draw(2, 2, current.map(i => solutions[i]))
            } else if (current.length < 9) {
                draw(3, 3, current.map(i => solutions[i]))
            } else {
                draw(nx, ny, current.map(i => solutions[i]))
            }
            needs_draw = false
        }
    }

    return { onScroll, onResize, onStep, onClick, viewer, row: viewer_row }
}

async function main(err: any) {
    if (err) { console.log(err) }
    const viewers = []
    const rows = [... <any>document.querySelectorAll('.viewer_row')]
    rows.forEach(async (row: HTMLElement, idx) => {
        viewers.push(await bind_viewer(row.dataset.datapath, row))
    })

    let last_scroll = window.scrollY
    let active_view = null
    function step() {
        window.requestAnimationFrame(step)
        if (last_scroll != window.scrollY) {
            viewers.forEach(v => v.onScroll())
            last_scroll = window.scrollY
        }
        if (!active_view) {
            active_view = viewers.find(v => inView(v.row))
            if (active_view) {
                active_view.viewer.append(canvas)
            }
        }
        if (active_view) {
            active_view.onStep()
            if (!inView(active_view.row)) {
                active_view = null
            }
        }
    }
    window.onresize = () =>  {
        viewers.forEach(v => v.onResize())
    }

    canvas.onclick = ({ offsetX: x, offsetY: y }) => {
        active_view.onClick(x, y)
    }

    window.requestAnimationFrame(step)
}
