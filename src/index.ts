import '../src/style.scss'
import { image_data } from './utils'
import ndarray from 'ndarray'
import Regl from 'regl'
import bind_parcoords from './parallel_coords'
import { fetch_json, sum, sample, range, clamp, inView } from './utils'
import { draw_districts } from './draw_command'
declare let window: any;
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

// const dist_width = 200

async function bind_viewer(datapath: string, viewer_row: HTMLElement) {
    console.log('Loading', datapath)
    const r = 2048
    let nx = 4
    let ny = 4

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

    let draw = draw_districts( regl, map_data, statedata )
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

    const onResize = (_nx, _ny) => {
        parcoords.width(viewer.clientWidth)
        parcoords.resize()
        parcoords.render()
        nx = _nx
        ny = _ny
        // nx = Math.floor(canvas.clientWidth / dist_width)
        // ny = Math.floor(canvas.clientHeight / dist_width)
        // console.log('setting', {nx, ny})
        // draw = draw_districts( regl, map_data, statedata )
        // window.map_texture.resize(width, height)
        current = sample(range(solutions.length), nx*ny)
        // console.log({nx, ny, width, height}, current.length);
        needs_draw = true
        // console.log(width, height);
    }

    const onStep = () => {
        if (needs_draw) {
            // if (current.length == 1) {
            //     draw(1, 1, current.map(i => solutions[i]))
            // } else if (current.length < 4) {
            //     draw(2, 2, current.map(i => solutions[i]))
            // } else if (current.length < 9) {
            //     draw(3, 3, current.map(i => solutions[i]))
            // } else if (current.length < 9) {
            //     draw(3, 3, current.map(i => solutions[i]))
            // } else {
            console.log(current);
            draw(nx, ny, current.map(i => solutions[i]))
            // }
            needs_draw = false
        }
    }

    const needsDraw = () => {
        needs_draw = true
    }

    return { onScroll, onResize, onStep, onClick, viewer, row: viewer_row, needsDraw }
}

async function main(err: any) {
    if (err) { console.log(err) }
    let viewers = []
    const rows = [... <any>document.querySelectorAll('.viewer_row')] as HTMLElement[]
    for (const row of rows) {
            viewers.push(await bind_viewer(row.dataset.datapath, row))
    }


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
                // console.log('switch to', active_view.row);
                active_view.viewer.append(canvas)
                active_view.needsDraw()
            }
        }
        if (active_view) {
            active_view.onStep()
            if (!inView(active_view.row)) {
                active_view = null
            }
        }
    }

    const resize = async () =>  {
        let new_w = viewers[0].viewer.clientWidth//
        let new_h = window.innerHeight - 320

        const base_dim = Math.min(window.innerWidth / 6, 200)
        const dim = new_h / Math.floor(new_h / base_dim)
        // console.log(dim);
        // const dim_x = 200 + new_w%200
        // const dim_y = 200 + new_h%200
        // console.log(dim_x, dim_y);
        // const num_x = Math.floor(new_w / dim_x), Math.floor(new_h / dim_x)
        // // console.log();
        // cosnt num_y = Math.floor(new_w / dim_y), Math.floor(new_h / dim_y));
        new_w -= new_w % dim

        canvas.style.width = new_w + 'px'
        canvas.style.height = new_h + 'px'
        // console.log(new_w / dim, new_h / dim)
        viewers.forEach(v => v.onResize(new_w / dim, new_h / dim))
    }
    window.onresize = resize
    resize()

    canvas.onclick = ({ offsetX: x, offsetY: y }) => {
        active_view.onClick(x, y)
    }

    window.requestAnimationFrame(step)
}
