import draw_map_shader from './shaders/draw_districts'
import { clamp, fetch_imagedata } from './utils'
import { RunData, StateData, DrawCMD, NdArray } from './datatypes'
import Regl from 'regl'
declare let window: any;

function district_color_values(district:NdArray, n_districts:number, statedata:StateData):number[] {
    const party_1 = new Array(n_districts).fill(0)
    const party_2 = new Array(n_districts).fill(0)
    for (let ti = 0; ti < district.shape[0]; ti++) {
        const di = district.get(ti)
        party_1[di] += statedata.voters[ti][0]
        party_2[di] += statedata.voters[ti][1]
    }
    const dist_values = party_1.map((v, idx) => {
        let p = ((v-party_2[idx]) / (v+party_2[idx]))
        return clamp((p*3.5)+0.5, 0, 1)
    })
    const tile_values = statedata.voters.map((_ ,i) => {
        return dist_values[district.get(i)]
    })    
    return tile_values
}

function tile_color_values(statedata:StateData ):number[] {
    const n_tiles = statedata.voters.length
    const dist_colors = statedata.voters.map(voters => {
        const v = (voters[0]-voters[1]) / (voters[0]+voters[1])
        // return clamp(v+0.5, 0, 1)
        return clamp((v*.5)+0.5, 0, 1)
    })
    return dist_colors
}

export class DrawController {
    // Class that handles all drawing and shader interaction.
    regl: any
    buffer_r: number
    cscale_image: string
    tile_district_values: Float32Array
    canvas: HTMLCanvasElement
    draw_cmd: Function
    color_scale: any
    // constructor(cscale_image:string ='imgs/partisan-gradient-export.png') {
    constructor(cscale_image:string ='imgs/scale_rdbu_1px.png') {
        this.buffer_r = 1024
        this.cscale_image = cscale_image
        this.canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
        this.tile_district_values = new Float32Array(this.buffer_r*this.buffer_r).fill(0)
        const gl = this.canvas.getContext("webgl", { preserveDrawingBuffer: false })
        this.regl = Regl({
            gl,
            extensions: [ 'oes_texture_float' ],
            optionalExtensions: [ 'oes_texture_half_float' ],
            attributes: { antialias: false }
        })
        this.draw_cmd = draw_map_shader(this.regl)
    }
    async initialize() { // Async calls go here. Load common data.
        this.color_scale = this.regl.texture(
            await fetch_imagedata(this.cscale_image)
        )
    }
    createViewerDrawCmd(rundata: RunData, mix: number): DrawCMD {
        /* Returns a simple function that the viewers can call. Abstracts
           away any shader or texture business.
        */
        const { regl, color_scale } = this
        const state = regl.texture(rundata.state_image)
        // const background = regl.texture(background_img)
        const voters = regl.texture({
            data: tile_color_values(rundata.state_data).map(v => v * 255),
            shape: [ rundata.state_data.voters.length, 1, 1 ]
        })
        return (nx: number, ny: number, selected_id:number, solutions: NdArray[]) => {
            let idx = 0
            console.time('draw')
            for (let i = 0; i < solutions.length; i++) {
                let values = district_color_values(solutions[i], 8, rundata.state_data)
                for (let j = 0; j < values.length; j++) {
                    this.tile_district_values[idx++] = values[j]
                }
            }
            this.tile_district_values.fill(0, idx)
            const districts = regl.texture({
                data: this.tile_district_values,
                shape: [ this.buffer_r, this.buffer_r, 1 ]
            })
            this.draw_cmd({
                nx, ny, selected_id, state, color_scale, mix,
                voters,
                colors: districts,
                n_solutions: solutions.length,
                n_tiles: rundata.state_data.voters.length,
                color_texture_size: this.buffer_r
            })
            
            // console.log(regl.read());
            console.timeEnd('draw')
        }
    }
}


// export function draw_districts(
//     regl: any,
//     draw_shader: any,
//     map_data: any,
//     statedata: StateData,
//     color_scale: any,
//     background: any,
//     method: "districts" | "tiles"
// ) {
//     const color_size = 1024
//     const map_texture = regl.texture(map_data)
//     let color_values = new Float32Array(color_size*color_size).fill(0)
//     const all_colors = regl.texture(color_scale)
//     background = regl.texture(background)

//     return (nx: number, ny: number, selected_id:number, solutions: number[][]) => {
//         let idx = 0
//         console.time('draw')
//         for (let i = 0; i < solutions.length; i++) {
//             let values
//             if (method == 'districts') {
//                 values = district_color_values(solutions[i], 8, statedata)
//             } else {
//                 values = tile_color_values(solutions[i], 8, statedata)
//             }
//             for (let j = 0; j < solutions[0].length; j++) {
//                 color_values[idx++] = values[j]
//             }
//         }
//         color_values.fill(255, idx)
//         const colors = regl.texture({
//             data: color_values,
//             shape: [ color_size, color_size, 1 ]
//         })
//         draw_shader({
//             colors, nx, ny, all_colors, selected_id, background,
//             map: map_texture,
//             n_tiles: statedata.voters.length,
//             color_texture_size: color_size
//         })
//         console.timeEnd('draw')
//     }
// }

