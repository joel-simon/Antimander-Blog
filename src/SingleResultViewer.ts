import { StateData, RunData, DrawCMD } from './datatypes'
import Viewer from './ResultViewer'
import { clamp, range } from './utils'

export default class extends Viewer {
    p_counts: HTMLInputElement
    slider: HTMLInputElement
    sorted_idxs: number[]
    draw_idx: number
    constructor(draw_cmd, container:HTMLElement, rundata: RunData) {
        super(draw_cmd, container, rundata, false)
        const sort_key = 'dem_advantage'
        this.sorted_idxs = range(this.values.length).sort((i, j) => {
            return this.values[i][sort_key] - this.values[j][sort_key]
        })
        console.log(this.sorted_idxs)
        this.draw_idx = this.sorted_idxs[Math.floor(rundata.X.shape[0] / 2)]
        this.p_counts = container.querySelector('p.counts')
        this.slider = container.querySelector('.slider')
        this.slider.oninput = () => {
            const v = parseFloat(this.slider.value)
            this.draw_idx = this.sorted_idxs[Math.floor(v * this.values.length)]
            this.needs_draw = true
        }
    }
    onStep() {
        const { needs_draw, draw_cmd, draw_idx, rundata, viewer_div, } = this
        if (needs_draw) {
            draw_cmd(1, 1, -1, [rundata.X.pick(draw_idx)])
            this.needs_draw = false
        }
    }
    onMouseMove() {}
    onMouseLeave() {}
    onClick() {}
}
// class old {
//     container: HTMLElement
//     viewer_div: HTMLElement
//     p_counts: HTMLInputElement
//     slider: HTMLInputElement
//     needs_draw: boolean
//     draw_idx: number
//     values: any[]
//     sorted_idxs: number[]
//     draw: (x:number, y:number, id: number, solutions: number[][]) => void
//     rundata: RunData
//     constructor(draw_command, container, rundata: RunData) {
//         this.draw = draw_command
//         this.needs_draw = true
//         this.rundata = rundata
//         this.values = rundata.values.map((v, i) => {
//             const obj:object = { index: i }
//             v.forEach((_v:number, _i:number) => obj[rundata.config.metrics[_i]] = _v)
//             return obj
//         })
//         const sort_key = 'dem_advantage'
//         this.sorted_idxs = range(this.values.length).sort((i, j) => {
//             return this.values[i][sort_key] - this.values[j][sort_key]
//         })
//         console.log(this.sorted_idxs)
//         this.draw_idx = this.sorted_idxs[Math.floor(rundata.values.length / 2)]
//         this.p_counts = container.querySelector('p.counts')
//         this.slider = container.querySelector('.slider')
//         this.container = container
//         this.viewer_div = this.container.querySelector('.district-viewer')
        
//         // this.draw(1, 1, -1, [rundata.solutions[0]])

//         this.slider.oninput = () => {
//             this.setActive(parseFloat(this.slider.value))
//         }
//     }
//     setActive(v: number) {
//         this.draw_idx = this.sorted_idxs[Math.floor(v * this.values.length)]
//         this.needs_draw = true
//     }
//     onStep() {
//         const { needs_draw, draw, draw_idx, rundata, viewer_div, } = this
//         if (needs_draw) {
//             draw(1, 1, -1, [rundata.solutions[draw_idx]])
//             // const lost_votes = this.rundata.metrics_data.lost_votes[this.draw_idx]
//             // const dem_districts = lost_votes.filter(([a, b]) => b > a).length
//             // const rep_districts = lost_votes.length - dem_districts
//             // this.p_counts.innerHTML = `${dem_districts} Democratic and ${rep_districts} Republican districts.`
//             this.needs_draw = false
//         }
//     }
//     needsDraw() {
//         this.needs_draw = true
//     }
//     onScroll() {

//     }
//     onResize() {

//     }
//     onMouseLeave() {

//     }
//     onMouseMove() {

//     }
// }