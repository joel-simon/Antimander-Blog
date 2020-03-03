import draw_map_shader from './shaders/draw_map'
import { clamp } from './utils'
declare var d3: any;

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

export function draw_districts(
    regl: any,
    map_data: any,
    statedata: StateData
) {
    console.log(statedata);
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
        draw_map({
            colors, nx, ny,
            map: map_texture,
            n_tiles: statedata.voters.length,
            color_texture_size: color_size
        })
        console.timeEnd('draw')
    }
}

