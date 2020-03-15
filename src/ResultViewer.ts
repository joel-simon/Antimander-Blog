import '../src/style.scss'
import { fetch_json, image_data, sum, sample, range, clamp, inView } from './utils'
import bind_parcoords from './parallel_coords'
import { RunData, StateData } from './datatypes'

export default class {
    container: HTMLElement
    viewer_div: HTMLElement
    needs_draw: boolean
    parcoords: any
    current: number[]
    nx: number
    ny: number
    nx_max: number
    ny_max: number
    values: any[]
    draw: (x:number, y:number, solutions: number[][]) => void
    rundata: RunData
    scroll_blocks: NodeListOf<HTMLElement>
    brushed_indexes: number[]
    constructor(draw_command, container, rundata: RunData) {
        this.draw = draw_command
        this.nx_max = 4
        this.ny_max = 4
        this.nx = this.nx_max
        this.ny = this.ny_max
        this.needs_draw = true
        this.brushed_indexes = range(rundata.solutions.length)
        this.current = sample(this.brushed_indexes, this.nx*this.ny)
        this.rundata = rundata
        this.values = rundata.values.map((v, i) => {
            const obj:object = { index: i }
            v.forEach((_v:number, _i:number) => obj[rundata.config.metrics[_i]] = _v)
            return obj
        })
        this.parcoords = bind_parcoords(
            container.querySelector('.parcoords'), this.values, (idx) => this._onParCoordsUpdate(idx)
        )
        this.container = container
        this.viewer_div = this.container.querySelector('.district-viewer')
        this.scroll_blocks = this.container.querySelectorAll('.scroll_block')
    }

    _onParCoordsUpdate(brushed_indexes: number[]) {
        const { current, parcoords, nx_max, ny_max } = this
        this.brushed_indexes = brushed_indexes
        if (current.length == 1) {
            parcoords.unhighlight()
        }
        this.current = sample(brushed_indexes, Math.min(brushed_indexes.length, nx_max*ny_max))
        this.needs_draw = true
    }

    onClick(x: number, y:number) {
        /* x and y are both percents. */
        const {  parcoords, nx, ny, nx_max, ny_max} = this
        if (this.current.length == 1) { // Reset.
            this.current = sample(range(this.rundata.solutions.length), nx_max*ny_max)
            this.needs_draw = true
            parcoords.unhighlight()
        } else { // Draw just one.
            const c_i = Math.floor(x * nx)
            const c_j = Math.floor(y * ny)
            this.current = [ this.current[ (c_i*nx) + c_j ] ]
            this.needs_draw = true
            parcoords.highlight([this.values[this.current[0]]])
        }
    }

    onMouseMove(x: number, y:number) {
        /* x and y are both percents. */
        const { nx, ny, rundata, values, parcoords, current } = this
        const c_i = Math.floor(x * nx)
        const c_j = Math.floor(y * ny)
        const index = current[(c_i*nx) + c_j]
        parcoords.highlight([values[index]])
    }

    onMouseLeave() {
        if (this.current.length > 1) { // If only one is selected, keep it highlighted.
            this.parcoords.unhighlight()
        }
    }

    onScroll() {
        const { viewer_div } = this
        const { top, bottom, height } = this.container.getBoundingClientRect()
        const stick_top_point = 0
        viewer_div.style.position = 'fixed'
        // console.log(viewer_div, top, bottom);
        if (bottom < window.innerHeight) {
            viewer_div.style.top = (bottom - window.innerHeight) + 'px'
        } else if (top < stick_top_point) { // Stuck to view.
            viewer_div.style.top = stick_top_point+'px'
        } else {
            viewer_div.style.top = top + 'px'   // Scroll normally when below.
        }
        this._updateScrollBlocks()
    }

    _updateScrollBlocks() {
        let most_middle = null
        const mobile = window.innerWidth < 800
        this.scroll_blocks.forEach(block => {
            const { top, height } = block.getBoundingClientRect()
            const y_perc = (top+height/2) / window.innerHeight
            const from_mid = Math.abs(y_perc - (mobile ? 0.75 : 0.5))*2
            block.style.opacity = (1.0 - clamp(from_mid, 0, 1)).toString()
            block.classList.remove('block_focus')
            if (most_middle == null || from_mid < most_middle[0]) {
                most_middle = [from_mid, block]
            }
        })
        most_middle[1].classList.add('block_focus')
    }

    onResize() {
        const { parcoords, viewer_div } = this
        parcoords.width(viewer_div.clientWidth)
        parcoords.resize()
        parcoords.render()
    //     // nx = _nx
    //     // ny = _ny
    //     // nx = Math.floor(canvas.clientWidth / dist_width)
    //     // ny = Math.floor(canvas.clientHeight / dist_width)
    //     // console.log('setting', {nx, ny})
    //     // draw = draw_districts( regl, map_data, statedata )
    //     // window.map_texture.resize(width, height)
    //     // current = sample(range(solutions.length), nx*ny)
    //     // console.log({nx, ny, width, height}, current.length);
    //     // needs_draw = true
    //     // console.log(width, height);
    }

    onStep() {
        const { needs_draw, draw, current, rundata, viewer_div, brushed_indexes } = this

        if (needs_draw) {
            this.nx = Math.min(Math.ceil(Math.sqrt(current.length)), this.nx_max)
            this.ny = this.nx
            draw(this.nx, this.ny, current.map(i => rundata.solutions[i]))
            viewer_div.querySelector('.view_count').innerHTML = `Viewing ${current.length} / ${brushed_indexes.length}`
            this.needs_draw = false
        }
    }

    needsDraw() {
        this.needs_draw = true
    }
}
