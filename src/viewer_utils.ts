import { file2ndarray, inView, percentSeen, query } from './utils'
import { NdArray, RunData } from './datatypes'
import ResultViewer from './ResultViewer'
import JsZip from 'jszip'

type RunDataResponse = [ any, any, NdArray, NdArray, NdArray ]
const rundata_cache = new Map()

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
    return { config, state_data, state_image, X, F }
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
                }
                if (active_viewer) {
                    active_viewer.container.querySelector('.canvas-container').append(canvas)
                    console.log('append');
                    
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