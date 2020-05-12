declare let window: any
import '../style/index.scss'
import ResultViewer from './ResultViewer'
import { query, queryAll } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_rundata, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
import './scroll_sections'
import { X_real, F_real } from './real_data'
import * as array_utils from './array_utils'
import init_viewer_events from './viewer_section'

function add_real_data(rundata:RunData) {
    // Add Wisconsin's real districts to the rundata.
    rundata.X = array_utils.append(rundata.X, X_real)
    const real_f = rundata.config.metrics.map(name => F_real[name])//.filter(v => v)
    rundata.F = array_utils.append(rundata.F, real_f)
}

async function main() {
    console.time('main')
    const viewers = []
    const draw_controller = new DrawController('/imgs/scale_rdbu_1px.png') // Create the drawing interface.
    await draw_controller.initialize()
    for (const row of queryAll('.viewer_row')) {
        let { datapath, stage } = row.dataset
        const rundata = await fetch_rundata(datapath, +stage)
        if (row.id == 'viewer') {
            add_real_data(rundata)
            rundata.config.metrics = [ "compactness", "competitiveness", "fairness" ]
        }
        const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
        const viewer = new ResultViewer(row, true)
        viewer.setData(draw_cmd, rundata, ['rep advantage'])
        viewers.push(viewer)
        if (row.id == 'viewer') {
            init_viewer_events(viewer, draw_controller)
            viewer_update_loop(viewers)// Start the draw loop before loading other viewers.
        }
    }
    console.timeEnd('main')
}

main()