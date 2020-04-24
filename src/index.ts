import '../style/index.scss'
import ResultViewer from './ResultViewer'
import ScrollViewer from './ScrollViewer'
import SingleResultViewer from './SingleResultViewer'
import { fetch_imagedata } from './utils'
import { RunData, DrawCMD } from './datatypes'
import { fetch_all_data, viewer_update_loop } from './viewer_utils'
import { DrawController } from './draw_controller'
declare let window: any;
import './hover_link'

async function load_viewers(): Promise<ResultViewer[]> {
    const viewers = []
    const draw_controller = new DrawController()
    await draw_controller.initialize()
    const background = await fetch_imagedata('imgs/district.png')
    
    // Load the single-viewer for the header.
    const rundata = await fetch_all_data('bias', 5)
    viewers.push(
        new SingleResultViewer(
            draw_controller.createViewerDrawCmd(rundata, background),
            document.querySelector('#header'),
            rundata
        )
    )
    document.querySelectorAll('.viewer_row').forEach(async (row: HTMLElement) => {
        const datapath = row.dataset.datapath
        const stage = +row.dataset.stage
        const rundata = await fetch_all_data(datapath, stage)
        const draw_cmd = draw_controller.createViewerDrawCmd(rundata, background)
        viewers.push(new ScrollViewer(draw_cmd, row, rundata))
    })
    return viewers
}

async function main() {
    const viewers = await load_viewers()
    viewer_update_loop(viewers)
}
main()