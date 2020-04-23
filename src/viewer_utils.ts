import { fetch_json, fetch_numpy, fetch_imagedata, inView } from './utils'
import { NdArray, RunData } from './datatypes'
import ResultViewer from './ResultViewer'

type RunDataResponse = [ any, any, NdArray, NdArray, NdArray ]

export function fetch_all_data(run:string, stage:number): Promise<RunData> {
    console.time('fetch_all_data')
    return Promise.all([
        fetch_json(`data/${run}/config.json`),
        fetch_json(`data/${run}/state_${stage}.json`),
        fetch_imagedata(`data/${run}/state_${stage}.png`),
        fetch_numpy(`data/${run}/X_${stage}.npy`),
        fetch_numpy(`data/${run}/F_${stage}.npy`)
    ]).then(([ config, state_data, state_image, X, F ]: RunDataResponse) => {
        console.timeEnd('fetch_all_data')
        return { config, state_data, state_image, X, F }
    })
}

export function viewer_update_loop(viewers: ResultViewer[]) {
    let last_scroll = null
    let active_viewer = viewers[0]
    const canvas = document.querySelector('canvas.main_canvas') as HTMLCanvasElement
    function step() {
        if (last_scroll != window.scrollY) {
            viewers.forEach(v => v?.onScroll())
            last_scroll = window.scrollY
        }
        if (!active_viewer) {
            active_viewer = viewers.find(v => inView(v.container))
            if (active_viewer) {
                console.log('Setting active viewer:', active_viewer)
                active_viewer.container.querySelector('.canvas_container').append(canvas)
                active_viewer.needsDraw()
            }
        }
        if (active_viewer) {
            active_viewer.onStep()
            if (!inView(active_viewer.container)) {
                console.log('Making inactive', active_viewer);
                
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
    step()
}