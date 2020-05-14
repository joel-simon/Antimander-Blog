declare let window: any
import '../style/index.scss'
import ResultViewer from './ResultViewer'
import { query, queryAll } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_rundata, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
// import './scroll_sections'
import { X_real, F_real } from './real_data'
import * as array_utils from './array_utils'
import bind_scroll_blocks from './scroll_block_events'

function add_real_data(rundata:RunData) {
    // Add Wisconsin's real districts to the rundata.
    rundata.X = array_utils.append(rundata.X, X_real)
    const real_f = rundata.config.metrics.map(name => F_real[name])    
    rundata.F = array_utils.append(rundata.F, real_f)
}

async function main() {
    console.time('main')
    const viewers = []
    // Create the drawing interface.
    const draw_controller = new DrawController('/imgs/scale_rdbu_1px.png')
    await draw_controller.initialize()

    // Load the first viewer and start draw loop before the others.
    console.time('time_to_first_viewer')
    const viewer_row = query('#overview.viewer_row')
    let { datapath, stage } = viewer_row.dataset    
    const rundata = await fetch_rundata(datapath, +stage)
    add_real_data(rundata)
    rundata.config.metrics = [ "compactness", "competitiveness", "fairness" ]
    const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
    const viewer = new ResultViewer(viewer_row, true)
    viewer.setData(draw_cmd, rundata, ['rep advantage'])
    viewer.setShape(1, 1)
    viewers.push(viewer)
    viewer_update_loop(viewers)
    console.timeEnd('time_to_first_viewer')
    viewer.needsDraw()
    
    bind_scroll_blocks(viewer, draw_controller)

    for (const row of queryAll('.viewer_row')) {
        let { datapath, stage } = row.dataset
        const rundata = await fetch_rundata(datapath, +stage)
        const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
        const viewer = new ResultViewer(row, true)
        viewer.setData(draw_cmd, rundata, ['rep advantage'])
        viewers.push(viewer)
    }
    console.timeEnd('main')
}
main()