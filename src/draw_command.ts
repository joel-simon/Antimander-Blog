import draw_map_shader from './shaders/draw_map'
import { clamp } from './utils'
import { RunData, StateData } from './datatypes'
declare let d3: any;
declare let window: any;

// function norm(array) {
//     let [min, max] = [Infinity, -Infinity]
//     for (const v of array) {
//         min = v < min ? v : min
//         max = v > max ? v : min
//     }
//     // const min = Math.min(...array.filter(x => !isNaN(x)))
//     // const max = Math.max(...array.filter(x => !isNaN(x)))
//     return array.map(x => (x-min) / (max-min))
// }


function district_color_values(
    district: number[],
    n_districts:number,
    statedata: StateData
):number[] {
    const party_1 = new Array(n_districts).fill(0)
    const party_2 = new Array(n_districts).fill(0)
    district.forEach((di:number, tile_idx:number) => {
        party_1[di] += statedata.voters[tile_idx][0]
        party_2[di] += statedata.voters[tile_idx][1]
    })
    const dist_values = party_1.map((v, idx) => {
        let p = ((v-party_2[idx]) / (v+party_2[idx]))
        return clamp((p*3.5)+0.5, 0, 1)
    })
    const tile_values = statedata.voters.map((_ ,i) => {
        return dist_values[district[i]]
    })
    return tile_values
}

function tile_color_values(
    district: number[],
    n_districts:number,
    statedata: StateData
):number[] {
    const n_tiles = statedata.voters.length
    const dist_colors = statedata.voters.map(voters => {
        const v = (voters[0]-voters[1]) / (voters[0]+voters[1])
        return clamp(v+0.5, 0, 1)
    })
    return dist_colors
}

export function draw_districts(
    regl: any,
    map_data: any,
    statedata: StateData,
    method: "districts" | "tiles"
) {
    const color_size = 1024
    const draw_map = draw_map_shader(regl)
    const map_texture = regl.texture(map_data)
    let color_values = new Float32Array(color_size*color_size).fill(0)
    // colorType: regl.hasExtension('oes_texture_half_float') ? 'half float' : 'float',

    const all_colors = regl.texture({
        data: new Array(1024).fill(0).map((_, i) => {
            const { r, g, b } = d3.color(d3.interpolateRdBu(i / 1024))
            return [ r, g, b ]
        }),
        shape: [1024, 1, 3]
    })

    return (nx: number, ny: number, solutions: number[][]) => {
        let idx = 0
        console.time('draw')
        for (let i = 0; i < solutions.length; i++) {
            let values
            if (method == 'districts') {
                values = district_color_values(solutions[i], 8, statedata)
            } else {
                values = tile_color_values(solutions[i], 8, statedata)
            }

            for (let j = 0; j < solutions[0].length; j++) {
                color_values[idx++] = values[j]
            }
        }
        color_values.fill(255, idx)
        const colors = regl.texture({
            data: color_values,
            shape: [ color_size, color_size, 1 ]
        })
        draw_map({
            colors,
            nx, ny,
            all_colors,
            map: map_texture,
            n_tiles: statedata.voters.length,
            color_texture_size: color_size
        })
        console.timeEnd('draw')
    }
}

