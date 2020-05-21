import { file2ndarray, inView, percentSeen, query, clamp } from './utils'
import ndarray from 'ndarray'
import { NdArray, RunData } from './datatypes'
import ResultViewer from './ResultViewer'
import JsZip from 'jszip'

type RunDataResponse = [ any, any, NdArray, NdArray, NdArray ]
const rundata_cache = new Map()


export function calc_district_stats({ X, state_data, config }: RunData): NdArray {
    console.time('district_stats')
    const N = X.shape[0]
    const stats = ndarray(new Float32Array(N*config.n_districts), [N, config.n_districts])
    for (let i = 0; i < N; i++) { // For each districting in population.
        let n_voters = new Uint32Array(config.n_districts) // Voters in each district.
        for (let ti = 0; ti < X.shape[1]; ti++) { // Sum up populations for each tile.
            const di = X.get(i, ti)
            n_voters[di] += state_data.voters[ti][0] + state_data.voters[ti][1]
            const diff = state_data.voters[ti][0] - state_data.voters[ti][1]
            stats.data[stats.index(i, di)] += diff
        }            
        for (let di = 0; di < config.n_districts; di++) {
            stats.data[stats.index(i, di)] /= n_voters[di]
        }
    }
    return stats
}

export function district_colors(d_idx:number, rundata:RunData, max_p:number=.50): number[] {
    // What percent is max color, smaller is bolder colors
    const { n_districts } = rundata.config
    return Array(n_districts).fill(0).map((_, i) => {
        const voter_p = rundata.district_stats.get(d_idx, i) // Percentage
        const color_p = ((.5 / max_p)*voter_p+0.5)
        return clamp(color_p, 0, .999)
    })
}

async function _fetch_rundata(run:string, stage:number): Promise<RunData> {
    console.time('fetch_rundata:'+run)
    const zipped = await fetch(`/data/${run}/Archive.zip`).then(d => d.arrayBuffer())
    const { files } = await JsZip.loadAsync(zipped)
    const F = await file2ndarray(files[`F_${stage}.npy`])
    const X = await file2ndarray(files[`X_${stage}.npy`])
    const config = JSON.parse(await files[`config.json`].async('text'))
    const state_data = JSON.parse(await files[`state_${stage}.json`].async('text'))
    const state_image = await file2ndarray(files[`state_${stage}.npy`])
    console.timeEnd('fetch_rundata:'+run)
    config.metrics = config.metrics.map(v => v.replace(/_/g, ' '))
    const district_stats = calc_district_stats({ X, state_data, config } as RunData)
    // const total_voters = state_data.voters.map(([r, d]) => r+d).reduce((a,b) => a+b, 0)    
    return { config, state_data, state_image, X, F, district_stats }
}
export async function fetch_rundata(run:string, stage:number):Promise<RunData> {
    let rundata
    if (rundata_cache[run]) {
        rundata = rundata_cache[run]
    } else {
        rundata = await _fetch_rundata(run, stage)
        rundata_cache[run] = rundata
    }
    return rundata
}

export function viewer_update_loop(viewers: ResultViewer[]) {
    let last_scroll = null
    viewers.sort((a, b) => percentSeen(b.container) - percentSeen(a.container))
    let active_viewer = viewers[0]
    const canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
    function step() {
        if (last_scroll != window.scrollY) {
            last_scroll = window.scrollY
            if (!active_viewer) {
                viewers.sort((a, b) => percentSeen(b.container) - percentSeen(a.container))
                
                if (inView(viewers[0].container)) {
                    active_viewer = viewers[0]
                    active_viewer.container.querySelector('.canvas-container').append(canvas)
                    // console.log('append', active_viewer.container.querySelector('.canvas-container'), canvas);                    
                    active_viewer.needsDraw()
                }
            }
            if (active_viewer && !inView(active_viewer.container)) {
                active_viewer = null
            }
        }
        if (active_viewer) {
            active_viewer.onStep()
        }
        window.requestAnimationFrame(step)
    }
    canvas.onclick = ({ offsetX: x, offsetY: y }) => {
        const { clientWidth: width, clientHeight: height } = canvas
        active_viewer?.onClick(x / width, y / height)
    }
    canvas.onmousemove = ({ offsetX: x, offsetY: y }) => {
        const { clientWidth: width, clientHeight: height } = canvas
        active_viewer?.onMouseMove(x / width, y / height)
    }
    canvas.onmouseleave = () => {
        active_viewer?.onMouseLeave()
    }
    window.addEventListener("resize", () => {
        viewers.forEach(v => v.onResize())
    })
    step()
}