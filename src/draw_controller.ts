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

function voter_color_values(statedata:StateData ):number[] {
    const n_tiles = statedata.voters.length
    const dist_colors = statedata.voters.map(voters => {
        const v = (voters[0]-voters[1]) / (voters[0]+voters[1])
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
    tile_district_colors: Float32Array

    t_district_values: any
    t_district_colors: any

    canvas: HTMLCanvasElement
    draw_cmd: Function
    color_scale: any

    constructor(cscale_image:string) {
        this.buffer_r = 512
        this.cscale_image = cscale_image
        this.canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
        this.tile_district_colors = new Float32Array(this.buffer_r*this.buffer_r).fill(0)
        this.tile_district_values = new Float32Array(this.buffer_r*this.buffer_r).fill(0)
        this.regl = Regl({
            gl: this.canvas.getContext("webgl", { preserveDrawingBuffer: false }),
            extensions: [ 'oes_texture_float' ],
            optionalExtensions: [ 'oes_texture_half_float' ],
            attributes: { antialias: false }
        })
        this.t_district_values = this.regl.texture()
        this.t_district_colors = this.regl.texture()
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
        const voters = regl.texture({
            data: voter_color_values(rundata.state_data).map(v => v * 255),
            shape: [ rundata.state_data.voters.length, 1, 1 ]
        })
        return (nx: number, ny: number, selected_id:number, solutions: NdArray[]) => {
            let idx = 0
            console.time('draw')
            // console.time('a')
            for (let i = 0; i < solutions.length; i++) {
                let values = district_color_values(solutions[i], 8, rundata.state_data)
                this.tile_district_colors.set(values, i*values.length)
                for (let j = 0; j < solutions[i].shape[0]; j++) {
                    this.tile_district_values[i*values.length + j] = solutions[i].get(j) / 8
                }
                idx = (i+1)*values.length
            }
            // console.timeEnd('a')
            // console.time('b')
            this.tile_district_values.fill(0, idx)
            this.tile_district_colors.fill(0, idx)
            // console.timeEnd('b')
            // console.time('c')
            
            // Reinitialize textures with data.
            this.t_district_values({
                data: this.tile_district_values,
                shape: [ this.buffer_r, this.buffer_r, 1 ]
            })
            this.t_district_colors({
                data: this.tile_district_colors,
                shape: [ this.buffer_r, this.buffer_r, 1 ]
            })
            // console.timeEnd('c')
            this.draw_cmd({
                nx, ny, selected_id, state, color_scale, mix, voters,
                tile_district_values: this.t_district_values,
                tile_district_colors: this.t_district_colors,
                n_solutions: solutions.length,
                n_tiles: rundata.state_data.voters.length,
                color_texture_size: this.buffer_r
            })
            // console.log(regl.read().filter(x => x != 0))
            // const data = regl.read().filter((x, idx) => idx%4 < 2)//.slice(0, 2044)
            // console.log(data);
            // console.log(data.reduce((a, b) => a+b, 0));
            console.timeEnd('draw')
        }
    }
}
