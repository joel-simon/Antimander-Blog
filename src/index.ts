declare let window: any
import '../style/index.scss'
import ResultViewer from './ResultViewer'
import HeaderViewer from './HeaderViewer'
import { fetch_imagedata, query, queryAll, fetch_npy_zip } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_rundata, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
// import './hover_link'
// import './scroll_sections'
import init_varytest  from './varytest'
// import smoothscroll from 'smoothscroll-polyfill'
import inlineSVG from './lib/inlineSVG.js'
// import ndarray from 'ndarray'
// import JsZip from 'jszip'

// window.BigUint64Array = null
// Bind scroll down button
// smoothscroll.polyfill() // Safari polyfill.
// query('#header .scroll_down').onclick = () => {
//     window.scrollTo({ top: window.innerHeight, left: 0, behavior: 'smooth' })
// }

// inlineSVG.init({
//     svgSelector: '.inline', // the class attached to all images that should be inlined
//     // initClass: 'js-inlinesvg', // class added to <html>
// });

async function main() {
    console.time('main')
    const viewers = []
    // Create the drawing interface.
    const color_scale_img = '/imgs/scale_rdbu_1px.png'
    const draw_controller = new DrawController(color_scale_img)
    await draw_controller.initialize()

    // Load the header viewer.
    const rundata = await fetch_rundata('general_fif_centers', 5)
    const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
    viewers.push(new HeaderViewer(draw_cmd, query('#cover'), rundata))
    
    // Start the draw loop before loading other viewers.
    viewer_update_loop(viewers)

    for (const row of queryAll('.viewer_row')) {
        let { datapath, stage } = row.dataset
        const rundata = await fetch_rundata(datapath, +stage)
        if (row.id == 'viewer') {
            rundata.config.metrics = [ "compactness", "competitiveness", "fairness" ]
        }
        const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
        const viewer = new ResultViewer(draw_cmd, row, rundata, true, ['rep advantage'])
        if (row.id == 'varytest') {
            init_varytest(viewer, draw_controller)
        }
        viewers.push(viewer)
    }
    console.timeEnd('main')
}

    

main()