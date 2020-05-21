import ResultViewer from './ResultViewer'
import { fetch_imagedata } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_rundata, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
declare let window: any
import '../style/index.scss'

async function main(run, stage) {
    const color_scale = await fetch_imagedata('/imgs/scale_rdbu_1px.png')    
    const draw_controller = new DrawController(color_scale, 0.3)
    const rundata: RunData = await fetch_rundata(run, stage)
    if (!rundata ) { 
        return console.log('Data not found.')
    }
    // const background = await fetch_imagedata('imgs/district.png')
    const container  = document.getElementById('viewer')
    const draw_cmd:DrawCMD = draw_controller.createViewerDrawCmd(rundata)
    const viewer = new ResultViewer(container, true, color_scale)
    viewer.setData(draw_cmd, rundata)
    viewer_update_loop([ viewer ])
}

const urlParams = new URLSearchParams(window.location.search)
if (!urlParams.has('run') || !urlParams.has('stage')) {
    alert('Query must have run and stage. i.e http://localhost:8080/view?run=t1000&stage=3')
} else {
    main(urlParams.get('run'), +urlParams.get('stage'))
}
 