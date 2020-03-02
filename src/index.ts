import '../src/style.scss'
import {image_data} from './utils'
import ndarray from 'ndarray'
import Regl from 'regl'
import draw_map_shader from './shaders/draw_map'
import bind_parcoords from './parallel_coords'
import { fetch_json, sum, sample, clamp, range } from './utils'
declare var d3: any;

interface RunData {
    config: any;
    values: number[][];
    solutions: number[][];
    metrics_data: any;
}

interface StateData {
    voters: [number, number][];
    population: number[];
}

const canvas = document.querySelector('canvas')
// let regl
const regl = Regl({
    canvas,
    extensions: [ 'oes_texture_float' ],
    attributes: { antialias: true },
    onDone: main
})

function district_color_values(
    district: number[],
    n_districts:number,
    statedata: StateData
):number[][] {
    const party_1 = new Array(n_districts).fill(0)
    const party_2 = new Array(n_districts).fill(0)
    district.forEach((di:number, tile_idx:number) => {
        party_1[di] += statedata.voters[tile_idx][0]
        party_2[di] += statedata.voters[tile_idx][1]
    })
    const ratios = party_1.map((v, idx) => ((v-party_2[idx]) / (v+party_2[idx])))
    const dist_colors = ratios.map((v) => {
        const {r, g, b} = d3.rgb(d3.interpolateRdBu(clamp((v*3.5)+0.5, 0, 1)))
        return [ r, g, b ]
    })
    return dist_colors
}

function draw_districts(
    regl: any,
    map_data: any,
    statedata: StateData
) {
    const color_size = 1024
    const data = new Uint8Array(color_size*color_size*3).fill(0)
    const draw_map = draw_map_shader(regl)
    const map_texture = regl.texture(map_data)
    return (nx: number, ny: number, solutions: number[][]) => {
        console.time('draw')
        let idx = 0
        for (let i = 0; i < solutions.length; i++) {
            const dist_values = district_color_values(solutions[i], 8, statedata)
            for (let j = 0; j < solutions[0].length; j++) {
                data[idx++] = dist_values[solutions[i][j]][0]
                data[idx++] = dist_values[solutions[i][j]][1]
                data[idx++] = dist_values[solutions[i][j]][2]
            }
        }
        data.fill(255, idx)
        const colors = regl.texture({
            data,
            width: color_size,
            height: color_size,
            channels: 3,
        })
        draw_map({ colors, nx, ny, map: map_texture, color_texture_size: color_size })
        console.timeEnd('draw')
    }
}


async function main(err: any) {
    // return ;
    const r = 2048
    const n_tiles = 6516
    const nx = 5
    const ny = 5
    const map_data = await image_data('imgs/test.png')

    const viewer:HTMLElement = document.querySelector('.district-viewer')
    const viewer_row:HTMLElement = document.querySelector('.viewer_row')
    let last_scroll = window.scrollY
    const viewer_height = viewer_row.clientHeight

    console.time('load_data')
    const [ rundata, statedata ]:[ RunData, StateData ] = await Promise.all([
        fetch_json('/data/rundata_4.json'),
        fetch_json('/data/statedata.json')
    ])
    const { config, values, solutions, metrics_data } = rundata
    let value_objs = values.map((v, i) => {
        const obj:object = { index: i }
        v.forEach((_v:number, _i:number) => obj[config.metrics[_i]] = _v)
        return obj
    })
    console.timeEnd('load_data')
    // Create a single draw call with data enclosed.
    const draw = draw_districts( regl, map_data, statedata )
    let current = sample(range(solutions.length), nx*ny)
    let needs_draw = true

    const parcoords = bind_parcoords(
        document.querySelector('.parcoords'),
        value_objs,
        (indexes: number[]) => {
            if (current.length == 1) {
                parcoords.unhighlight()
            }
            current = sample(indexes, nx*ny)
            needs_draw = true
        }
    )
    canvas.onclick = ({ offsetX: x, offsetY: y }) => {
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
    // console.log(viewer.getBoundingClientRect());
    // console.log(viewer.clientHeight, viewer.getBoundingClientRect().height, );

    function step() {
        window.requestAnimationFrame(step)

        if (last_scroll != window.scrollY) {
            const { top, bottom, height } = viewer_row.getBoundingClientRect()

            const stick_top_point = 0//(window.innerHeight - viewer.clientHeight) /2
            // console.log(stick_top_point);

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
            last_scroll = window.scrollY
        }
        if (needs_draw) {
            console.log(current.length, nx,ny);
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
    window.onresize = () =>  {
        parcoords.width(viewer.clientWidth)
        parcoords.resize()
        parcoords.render()
    }
    window.requestAnimationFrame(step)
}
