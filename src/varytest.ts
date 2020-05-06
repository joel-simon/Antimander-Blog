import { queryAll } from './utils'
import { fetch_rundata } from './viewer_utils'
import ResultViewer from './ResultViewer'

const run_cache = new Map()

export default function(viewer: ResultViewer, draw_controller) {
    // Initialize the section that contains optimization for bias.
    // This function bind the images in the text column to update the viewer.
    queryAll('.map_opts img', viewer.container).forEach(img => {
        const { datapath, stage } = img.dataset
        img.onclick = async () => {
            let rundata 
            if (run_cache[datapath]) {
                rundata = run_cache[datapath]
            } else {
                rundata = await fetch_rundata(datapath, +stage)
                run_cache[datapath] = rundata
            }
            const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
            viewer.setData(draw_cmd, rundata, ['rep advantage'])
        }
    })
    
}