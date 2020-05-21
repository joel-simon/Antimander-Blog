import draw_map_shader from './shaders/draw_districts'
import { clamp, fetch_imagedata, nextPowerOf2 } from './utils'
import { RunData, StateData, DrawCMD, NdArray } from './datatypes'
import { district_colors } from './viewer_utils'
import ndarray from 'ndarray'
import Regl from 'regl'
declare let window: any;

export class DrawController {
    // Class that handles all drawing and shader interaction.
    regl: any
    buffer_r: number
    debug: boolean
    // cscale_image: string
    tile_district_values: Float32Array
    tile_district_colors: Float32Array
    t_district_values: any
    t_district_colors: any
    canvas: HTMLCanvasElement
    draw_cmd: Function
    color_scale: any
    mix: number
    constructor(color_scale_data:NdArray, mix:number) {
        this.mix = mix
        this.buffer_r = 512
        this.debug = false
        this.canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
        this.tile_district_colors = new Float32Array(this.buffer_r*this.buffer_r).fill(0)
        this.tile_district_values = new Float32Array(this.buffer_r*this.buffer_r).fill(0)
        this.regl = Regl({
            gl: this.canvas.getContext("webgl", { preserveDrawingBuffer: this.debug }),
            extensions: [ 'oes_texture_float' ],
            optionalExtensions: [ 'oes_texture_half_float' ],
            attributes: { antialias: true }
        })
        this.color_scale = this.regl.texture(color_scale_data)
        this.t_district_values = this.regl.texture()
        this.t_district_colors = this.regl.texture()
        this.draw_cmd = draw_map_shader(this.regl)
    }
    createViewerDrawCmd(rundata: RunData): DrawCMD {
        /* Returns a simple function that the viewers can call. Abstracts
           away any shader or texture business.
        */
        const { regl, color_scale } = this
        const n_tiles = rundata.state_data.voters.length
        const { n_districts } = rundata.config
        const state = regl.texture({data: rundata.state_image, wrap: 'clamp'})
        const voters = regl.texture({data: this.voter_color_values(rundata.state_data), wrap: 'clamp'})
        return (nx: number, ny: number, selected_id:number, to_draw: number[]) => {
            let idx = 0
            // console.time('draw')
            to_draw.forEach((dist_idx, i) => {
                const district = rundata.X.pick(dist_idx)
                let values = this.district_color_values(dist_idx, district, rundata)
                this.tile_district_colors.set(values, i*values.length)
                for (let j = 0; j < district.shape[0]; j++) {
                    this.tile_district_values[i*values.length + j] = district.get(j) / n_districts
                }
                idx = (i+1)*values.length
            })
            this.tile_district_values.fill(0, idx)
            this.tile_district_colors.fill(0, idx)
            // Reinitialize textures with data.
            this.t_district_values({
                data: this.tile_district_values,
                shape: [ this.buffer_r, this.buffer_r, 1 ]
            })
            this.t_district_colors({
                data: this.tile_district_colors,
                shape: [ this.buffer_r, this.buffer_r, 1 ]
            })
            
            this.draw_cmd({
                nx, ny, selected_id, state, color_scale, voters, n_tiles, n_districts,
                mix: this.mix,
                tile_district_values: this.t_district_values,
                tile_district_colors: this.t_district_colors,
                n_solutions: (window.innerWidth < 768) ? 4 : to_draw.length, //BAd hack
                color_texture_size: this.buffer_r,
                voters_texture_size: 128,
                border_radius: 1,
            })
            if (this.debug) {
                const data = regl.read().filter((x, idx) => idx%4 < 2)
                console.log(data.reduce((a, b) => a+b, 0));
            }
            // console.timeEnd('draw')
        }
    }
    voter_color_values({voters}:StateData):NdArray {
        const n_tiles = voters.length
        const data = new Uint8Array(128 * 128)
        voters.forEach((voters, idx) => {
            const v = (voters[0]-voters[1]) / (voters[0]+voters[1])
            data[idx] = Math.floor(clamp(((v*.5)+0.5) * 255, 0, 255))
        })
        return ndarray(data, [ 128, 128, 1 ])
    }
    district_color_values(d_i:number, district:NdArray, rundata:RunData):number[] {
        const d_colors = district_colors(d_i, rundata)
        .map(v => {
            if (v > .5) {
                return Math.pow((v-0.5)*2, .6)/2 + 0.5
            } else {
                let _v = 1 - v
                let d = Math.pow(Math.abs((_v-0.5)*2), .6)/2 + 0.5
                return 1-d
            }
        })
        const tile_values = rundata.state_data.voters.map((_ ,i) => {
            return d_colors[district.get(i)]
        })    
        return tile_values
    }
}
