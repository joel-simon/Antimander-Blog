import { fetch_json, fetch_numpy, fetch_imagedata, inView, percentSeen } from './utils'
import { NdArray, RunData } from './datatypes'
import ResultViewer from './ResultViewer'
import image_promise from 'image-promise';

import ndarray from 'ndarray'
import npyjs from "./lib/npy.js"
import JsZip from 'jszip'

type RunDataResponse = [ any, any, NdArray, NdArray, NdArray ]

async function file2ndarray(file: any) {
    const np = new npyjs()
    const unzip = await file.async('arraybuffer')
    const { shape, data } = np.parse(unzip)
    return ndarray(data, shape)
}

export async function fetch_rundata(run:string, stage:number): Promise<RunData> {
    console.time('fetch_rundata:'+run)
    const np = new npyjs()
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
    // console.log(files)
    // const alldata = Promise
    // fetch_imagedata(`/data/${run}/state_${stage}.png`),
    // return Promise.all([
    //     fetch_json(`/data/${run}/config.json`),
    //     fetch_json(`/data/${run}/state_${stage}.json`),
    //     image_promise(`/data/${run}/state_${stage}.png`),
    //     fetch_numpy(`/data/${run}/X_${stage}.npy`),
    //     fetch_numpy(`/data/${run}/F_${stage}.npy`)
    // ]).then(([ config, state_data, state_image, X, F ]: RunDataResponse) => {
    //     console.timeEnd('fetch_rundata:'+run)
    //     config.metrics = config.metrics.map(v => v.replace(/_/g, ' '))
    //     return { config, state_data, state_image, X, F }
    // })
}

export function viewer_update_loop(viewers: ResultViewer[]) {
    let last_scroll = null
    viewers.sort((a, b) => percentSeen(b.container) - percentSeen(a.container))
    let active_viewer = viewers[0]
    const canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
    function step() {
        if (last_scroll != window.scrollY) {
            // viewers.forEach(v => v?.onScroll())
            last_scroll = window.scrollY
        }
        if (!active_viewer) {
            viewers.sort((a, b) => percentSeen(b.container) - percentSeen(a.container))
            if (inView(viewers[0].container)) {
                active_viewer = viewers[0]
            }
            if (active_viewer) {
                // console.log('Setting active viewer:', active_viewer)
                active_viewer.container.querySelector('.canvas-container').append(canvas)
                active_viewer.needsDraw()
            }
        }
        if (active_viewer) {
            active_viewer.onStep()
            if (percentSeen(active_viewer.container) < 0.5) {
                // console.log('Making inactive', active_viewer);
                active_viewer = null
            }
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
    window.onresize = () => {
        viewers.forEach(v => v.onResize())
    }
    step()
}