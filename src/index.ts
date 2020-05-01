import '../style/index.scss'
import ResultViewer from './ResultViewer'
import SingleResultViewer from './SingleResultViewer'
import { fetch_imagedata } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_all_data, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
import './hover_link'
import './scroll_sections'
import smoothscroll from 'smoothscroll-polyfill'
import inlineSVG from './lib/inlineSVG.js'
import ndarray from 'ndarray'
smoothscroll.polyfill() // Safari polyfill.
declare let window: any

async function load_viewers(): Promise<ResultViewer[]> {
    const viewers = []
    const draw_controller = new DrawController()
    await draw_controller.initialize()
    
    // Load the single-viewer for the header.
    // const rundata = await fetch_all_data('general_fif_centers', 5)
    const rundata = await fetch_all_data('general_fif_centers', 5)
    viewers.push(
        new SingleResultViewer(
            draw_controller.createViewerDrawCmd(rundata, .5),
            document.querySelector('#header'),
            rundata
        )
    )
    document.querySelectorAll('.viewer_row').forEach(async (row: HTMLElement) => {
        let { datapath, background, stage } = row.dataset
        const sticky = row.classList.contains('sticky')
        const rundata = await fetch_all_data(datapath, +stage)
        // let mix = parseFloat(row.dataset.mix) || 0.7
        // const background_img = backgrounds[background || 'WI']
        const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
        viewers.push(new ResultViewer(draw_cmd, row, rundata))
    })
    return viewers
}

(document.querySelector('#header .scroll_down') as HTMLElement).onclick = () => {
    window.scrollTo({
        top: window.innerHeight,
        left: 0,
        behavior: 'smooth'
    });
}

inlineSVG.init({
    svgSelector: '.inline', // the class attached to all images that should be inlined
    // initClass: 'js-inlinesvg', // class added to <html>
});


async function main() {
    const viewers = await load_viewers()
    viewer_update_loop(viewers)
}
main()