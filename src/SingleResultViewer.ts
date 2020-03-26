import { range } from './utils'
import { RunData, StateData } from './datatypes'
import ResultViewer from './ResultViewer'

export default class {
    container: HTMLElement
    viewer_div: HTMLElement
    slider: HTMLInputElement
    needs_draw: boolean
    draw_idx: number
    values: any[]
    sorted_idxs: number[]
    draw: (x:number, y:number, id: number, solutions: number[][]) => void
    rundata: RunData
    constructor(draw_command, container, rundata: RunData) {
        this.draw = draw_command
        this.needs_draw = true
        this.draw_idx = 0
        this.rundata = rundata
        this.values = rundata.values.map((v, i) => {
            const obj:object = { index: i }
            v.forEach((_v:number, _i:number) => obj[rundata.config.metrics[_i]] = _v)
            return obj
        })
        const sort_key = 'compactness_convex_hull'
        this.sorted_idxs = range(this.values.length).sort((i, j) => {
            return this.values[i][sort_key] - this.values[j][sort_key]
        })
        this.slider = container.querySelector('.slider')
        this.container = container
        this.viewer_div = this.container.querySelector('.district-viewer')
        
        this.draw(1, 1, -1, [rundata.solutions[0]])

        this.slider.oninput = () => {
            this.setActive(parseFloat(this.slider.value))
        }
    }
    setActive(v: number) {
        this.draw_idx = this.sorted_idxs[Math.floor(v * this.values.length)]
        // console.log(v, this.values.length, this.draw_idx)
        this.needs_draw = true
    }
    onStep() {
        const { needs_draw, draw, draw_idx, rundata, viewer_div, } = this
        if (needs_draw) {
            console.log(draw_idx, [rundata.solutions[draw_idx]])
            draw(1, 1, -1, [rundata.solutions[draw_idx]])
            this.needs_draw = false
        }
    }
    needsDraw() {
        this.needs_draw = true
    }
    onScroll() {

    }
    onResize() {

    }
    onMouseLeave() {

    }
    onMouseMove() {

    }
}