import { sample, range } from './utils'
import bind_parcoords from './parallel_coords'
import { StateData, RunData, DrawCMD, NdArray } from './datatypes'
import { district_colors } from './viewer_utils'
import { svg_circle, svg_line } from './svg'

export default class {
    container: HTMLElement
    viewer_div: HTMLElement
    zero_warning: HTMLElement
    view_count: HTMLElement
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
    hidden_axes: string[]
    circles: SVGElement[]
    color_scale: NdArray
    dist_chart: SVGElement
    constructor(container:HTMLElement, use_parcoords=true, color_scale:NdArray) {
        this.container = container
        this.nx_max = 3
        this.ny_max = 3
        this.nx = this.nx_max
        this.ny = this.ny_max
        this.use_parcoords = use_parcoords
        this.draw_cmd = null
        this.rundata = null
        this.color_scale = color_scale
        this.view_count = container.querySelector('.view_count')
        this.view_count.onclick = () => this.resample()
        this.zero_warning = container.querySelector('.zero_warning')
        this.zero_warning.onclick = () => this.reset()   
        this.dist_chart = container.querySelector('.dist_chart')
    }
    
    setData(draw_cmd, rundata, hidden_axes=[]) {
        if (rundata == this.rundata) {
            return
        }        
        this.draw_cmd = draw_cmd
        this.rundata = rundata
        this.hidden_axes = hidden_axes
        this.needs_draw = true
        this.hover_idx = -1
        this.viewer_div = this.container.querySelector('.district-viewer')
        this.values = new Array(rundata.F.shape[0]).fill(0).map((_, i) => {
            const obj:object = { index: i }
            for (let j = 0; j < rundata.F.shape[1]; j++) {
                obj[rundata.config.metrics[j]] = rundata.F.get(i, j) * -1 //Hack to flip y order.
            }
            return obj
        })        
        if (this.use_parcoords) {
            this._createParcoords()
        }
        this.reset()
        this.create_chart()
    }

    create_chart() {
        const w = 384
        this.circles = []
        this.dist_chart.innerHTML = ''
        this.dist_chart.appendChild(svg_line(0, 15, w, 15, 1))

        for (const p of [-35, -15, 0, 15, 35]) {
            const x = w * ((p/100)+0.5)
            this.dist_chart.appendChild(svg_line(x, 4, x, 24, 1))
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            text.setAttribute('x', (x-20).toString())
            text.setAttribute('y', '45');
            text.setAttribute('fill', '#000');
            text.classList.add('metadata')
            if (p < 0) {
                text.textContent = `+${-1*p}%`;
                this.dist_chart.appendChild(text)
            } else if (p > 0) {
                text.textContent = `+${p}%`;
                this.dist_chart.appendChild(text)
            }
        }
        for (let i = 0; i < this.rundata.config.n_districts; i++) {
            const c = svg_circle(Math.random()*w, 15+(Math.random()-0.5)*5, 10)
            c.setAttributeNS(null,"fill","red");
            c.setAttributeNS(null,"opacity","0.6");
            this.dist_chart.appendChild(c)
            this.circles.push(c)
        }
    }

    update_metadata() {
        // return
        const { current, hover_idx, brushed_indexes } = this
        
        if (current.length != 1 && hover_idx == -1) {

            if (brushed_indexes.length == this.rundata.X.shape[0]) {
                this.view_count.innerHTML = `Viewing ${current.length} random maps, click to resample`
            } else {
                this.view_count.innerHTML = `Viewing ${current.length} / ${brushed_indexes.length} selected, click to resample`
            }
            this.dist_chart.classList.add('hidden')
        } else {
            const idx = (current.length == 1) ? current[0] : current[hover_idx]
            this.dist_chart.classList.remove('hidden')
            const w = 384
            const values = this.rundata.district_stats.pick(idx)
            let n_d = 0
            let n_r = 0
            district_colors(idx, this.rundata).forEach((p, di) => {
                const j = Math.floor(p * this.color_scale.shape[0])            
                const r = this.color_scale.get(j, 0, 0)
                const g = this.color_scale.get(j, 0, 1)
                const b = this.color_scale.get(j, 0, 2)
                this.circles[di].setAttribute('cx', (w * p).toString())
                this.circles[di].setAttribute('fill', `rgb(${r},${g},${b})`)
                if (p > 0.5) { n_d++ } else { n_r++ }
            })
            this.view_count.innerHTML = `${n_r} Rep&nbsp;&nbsp;&nbsp;${n_d} Dem`
        }
    }
    
    reset() {
        this.brushed_indexes = range(this.rundata.X.shape[0])
        this.resample()
        this.parcoords.brushReset()
    }

    resample() {
        this.setCurrent(sample(this.brushed_indexes, this.nx*this.ny))
    }
    
    _createParcoords() {
        // Delete any that already exist.
        this.container.querySelector('.parcoords').innerHTML = ''
        delete this.parcoords
        this.parcoords = bind_parcoords(
            this.container.querySelector('.parcoords'),
            this.values,
            this.hidden_axes,
            (idx) => this._onParCoordsUpdate(idx)
        )
    }
    
    setShape(nx:number, ny:number) {
        this.nx_max = nx
        this.ny_max = ny
        this.nx = this.nx_max
        this.ny = this.ny_max
        if (this.rundata) {
            if (this.brushed_indexes) {
                this.setCurrent(sample(this.brushed_indexes, this.nx*this.ny))
            } else {
                this.setCurrent(sample(range(this.rundata.X.shape[0]), this.nx*this.ny))
            }
        }
    }

    setCurrent(current:number[]) {
        this.current = current
        if (current.length == 1) {
            this.parcoords.highlight([this.values[this.current[0]]])
        } else {
            this.parcoords.unhighlight()
        }
        this.needsDraw()
    }

    _onParCoordsUpdate(brushed_indexes: number[]) {
        const { current, parcoords, nx_max, ny_max } = this
        this.brushed_indexes = brushed_indexes
        if (brushed_indexes.length == 0) {
            this.zero_warning.classList.remove('hidden')
        } else {
            this.zero_warning.classList.add('hidden')
        }
        if (current.length == 1) {
            parcoords.unhighlight()
        }
        this.current = sample(brushed_indexes, Math.min(brushed_indexes.length, nx_max*ny_max))        
        this.needs_draw = true
    }

    onClick(x: number, y:number) {
        /* x and y are both percents. */
        const {  parcoords, nx, ny, nx_max, ny_max} = this        
        if (this.current.length == 0) { // Zero selected, reset random.
            this.reset()
        } else if (this.current.length == 1) { // Reset.
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
        // const hover_idx = (c_j*ny) + c_i
        // console.log(nx, ny, c_i, c_j);
        const hover_idx = (c_i*ny) + c_j
        if (hover_idx != this.hover_idx && this.current.length) {
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
            // Unfortunately, the resize method is broken. So we must recreate.
            // https://github.com/BigFatDog/parcoords-es/issues/73
            this._createParcoords()
        }
    }

    onStep() {
        if (this.needs_draw) {
            if (this.nx_max == this.ny_max) {
                this.nx = Math.min(Math.ceil(Math.sqrt(this.current.length)), this.nx_max)
                this.ny = Math.min(this.nx, this.ny_max)
            } else { // Temporary hard code to deal with NC.                 
                if (this.current.length <= 2) {
                    this.nx = 1
                    this.ny = 2
                } else {
                    this.nx = Math.min(this.nx_max, this.current.length)
                    this.ny = Math.min(this.ny_max, this.current.length)
                }
            }
            this.draw_cmd(this.nx, this.ny, this.hover_idx, this.current)
            this.update_metadata()
            this.needs_draw = false
        }
    }

    onScroll() { 
    }

    needsDraw() {
        this.needs_draw = true
    }
}
