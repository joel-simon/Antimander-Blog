import { sample, range, clamp, inView } from './utils'
import bind_parcoords from './parallel_coords'
import { StateData, RunData, DrawCMD } from './datatypes'

export default class {
    container: HTMLElement
    viewer_div: HTMLElement
    needs_draw: boolean
    values: any[]
    draw_cmd: DrawCMD
    parcoords: any
    current: number[]
    nx: number
    ny: number
    nx_max: number
    ny_max: number
    rundata: RunData
    brushed_indexes: number[]
    hover_idx: number
    use_parcoords: boolean
    constructor(container:HTMLElement, use_parcoords=true) {
        this.container = container
        this.nx_max = 3
        this.ny_max = 3
        this.nx = this.nx_max
        this.ny = this.ny_max
        this.use_parcoords = use_parcoords
        this.draw_cmd = null
        this.rundata = null
    }
    setData(draw_cmd, rundata, hidden_axes=[]) {
        this.draw_cmd = draw_cmd
        this.rundata = rundata
        this.needs_draw = true
        this.hover_idx = -1
        this.brushed_indexes = range(rundata.X.shape[0])
        this.current = sample(this.brushed_indexes, this.nx*this.ny)
        this.viewer_div = this.container.querySelector('.district-viewer')
        this.values = new Array(rundata.F.shape[0]).fill(0).map((_, i) => {
            const obj:object = { index: i }
            for (let j = 0; j < rundata.F.shape[1]; j++) {
                obj[rundata.config.metrics[j]] = rundata.F.get(i, j)
            }
            return obj
        })        
        if (this.use_parcoords) {
            this.container.querySelector('.parcoords').innerHTML = ''
            delete this.parcoords
            this.parcoords = bind_parcoords(
                this.container.querySelector('.parcoords'),
                this.values, hidden_axes,
                (idx) => this._onParCoordsUpdate(idx)
            )
        }
    }

    setShape(nx:number, ny:number) {
        this.nx_max = nx
        this.ny_max = ny
        this.nx = this.nx_max
        this.ny = this.ny_max
        console.log({nx, ny});
        if (this.brushed_indexes) {
            this.current = sample(this.brushed_indexes, this.nx*this.ny)
        } else {
            this.current = sample(range(this.rundata.X.shape[0]), this.nx*this.ny)
        }
        this.needsDraw()
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
            this.current = sample(range(this.rundata.X.shape[0]), nx_max*ny_max)
            this.needs_draw = true
            parcoords.unhighlight()
        } else { // Draw just one.
            const c_i = Math.floor(x * nx)
            const c_j = Math.floor(y * ny)
            this.current = [ this.current[ (c_j*ny) + c_i ] ]
            this.needs_draw = true
            parcoords.highlight([this.values[this.current[0]]])
        }
    }

    onMouseMove(x: number, y:number) {
        /* x and y are both percents. */
        if (this.current.length == 1) {
            return
        }
        const { nx, ny, values, parcoords, current } = this
        const c_i = Math.floor(x * nx)
        const c_j = Math.floor(y * ny)
        const hover_idx = (c_j*ny) + c_i
        // console.log(c_i, c_j, hover_idx);
        if (hover_idx != this.hover_idx) {
            this.hover_idx = hover_idx
            parcoords.highlight([values[current[hover_idx]]])
            this.needs_draw = true
        }
    }

    onMouseLeave() {
        if (this.current.length > 1) { // If only one is selected, keep it highlighted.
            this.parcoords.unhighlight()
        }
        this.hover_idx = -1
        this.needs_draw = true
    }


    onResize() {
        const { parcoords, viewer_div } = this

        const vw = viewer_div.clientWidth
        // if (vw < 400) {
        //     this.nx_max = 2
        //     this.ny_max = 2
        // }
        // //  else if (vw < 600) {
        // //     this.nx_max = 3
        // //     this.ny_max = 3
        // // }
        //  else {
        //     this.nx_max = 3
        //     this.ny_max = 3
        // }
        // console.log(vw)
        if (parcoords) {
            parcoords.width(vw)
            parcoords.resize()
            parcoords.render()
        }
        // nx = _nx
        // ny = _ny
        // nx = Math.floor(canvas.clientWidth / dist_width)
        // ny = Math.floor(canvas.clientHeight / dist_width)
        // console.log('setting', {nx, ny})
        // draw = draw_districts( regl, map_data, statedata )
        // window.map_texture.resize(width, height)
        // current = sample(range(solutions.length), nx*ny)
        // console.log({nx, ny, width, height}, current.length);
        // needs_draw = true
        // console.log(width, height);
    }

    onStep() {
        const { needs_draw, draw_cmd, current, rundata, viewer_div, brushed_indexes } = this
        if (needs_draw) {
            this.nx = Math.min(Math.ceil(Math.sqrt(current.length)), this.nx_max)
            this.ny = Math.min(this.nx, this.ny_max)
            // console.log(this.nx, this.ny);
            draw_cmd(this.nx, this.ny, this.hover_idx, current.map(i => rundata.X.pick(i)))
            viewer_div.querySelector('.view_count').innerHTML = `Viewing ${current.length} / ${brushed_indexes.length}`
            this.needs_draw = false
        }
    }

    onScroll() { 
    }

    needsDraw() {
        this.needs_draw = true
    }
}
