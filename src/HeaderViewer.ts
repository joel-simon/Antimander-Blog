import { StateData, RunData, DrawCMD, NdArray } from './datatypes'
import Viewer from './ResultViewer'
import { clamp, range } from './utils'
import ndarray from 'ndarray'
import { X_real, F_real } from './real_data'
import * as array_utils from './array_utils'

export default class extends Viewer {
    p_counts: HTMLInputElement
    sorted_idxs: number[]
    draw_idx: number
    winners: Uint8Array
    sliders: NodeListOf<any>
    rundata: RunData
    constructor(draw_cmd, container:HTMLElement, rundata: RunData) {
        super(draw_cmd, container, rundata, false)
        rundata.X = array_utils.append(rundata.X, X_real)
        const f = rundata.config.metrics.map(name => F_real[name]).filter(v => v)
        console.log(f);
        
        rundata.F = array_utils.append(rundata.F, f)
        this.rundata = rundata
        this.draw_idx = null
        this.p_counts = container.querySelector('p.counts')
        this.sliders = container.querySelectorAll('.slider') as NodeListOf<any>
        // const ranges = array_utils.minmax(rundata.F)
        // console.log(rundata.F);
        // console.log(ranges);
        
        
        this.sliders.forEach((slider, idx) => {
            const { metric } = slider.dataset
            slider.metric_index = rundata.config.metrics.indexOf(metric)
            // slider.min = ranges.mins[slider.metric_index]
            // slider.max = ranges.maxs[slider.metric_index]
            slider.sorted_idxs = range(this.values.length).sort((i, j) => {
                return this.values[j][metric] - this.values[i][metric]
            })
            slider.oninput = () => this._udpateSliders(slider)
        })
        this.winners = this._calculateWinners(rundata)
        const button:HTMLElement = document.querySelector('.set_current')
        button.onclick = () => {
            this.setRealMap()
        }
        this.setRealMap()
        
    }
    setRealMap() {
        this.draw_idx = this.rundata.X.shape[0]-1
        this.sliders.forEach((slider, idx) => {
            const m_idx = slider.metric_index
            slider.value = this.rundata.F.get(this.draw_idx, m_idx)
        })
        this.needs_draw = true
    }
    _udpateSliders(slider) {
        const v = parseFloat(slider.value)
        this.draw_idx = slider.sorted_idxs[Math.floor(v * this.values.length)]
        this.needs_draw = true
        this.sliders.forEach(_slider => {
            const m_idx = _slider.metric_index
            if (slider != _slider) {
                // _slider.value = this.rundata.F.get(this.draw_idx, m_idx).toString()
                _slider.value  = (_slider.sorted_idxs.indexOf(this.draw_idx) / this.rundata.X.shape[0]).toString()
            }
        })            
    }
    _calculateWinners({ X, state_data }: RunData): Uint8Array {
        const dem_dists = new Uint8Array(X.shape[0])
        for (let i = 0; i < X.shape[0]; i++) {
            const counts = new Int32Array(8)
            for (let ti = 0; ti < X.shape[1]; ti++) {
                const di = X.get(i, ti)
                counts[di] += state_data.voters[ti][0]
                counts[di] -= state_data.voters[ti][1]
            }
            dem_dists[i] = counts.filter(x => x > 0).length
        }
        return dem_dists
    }
    onStep() {
        const { needs_draw, draw_cmd, draw_idx, rundata, viewer_div, } = this
        if (needs_draw) {
            const dem_districts = this.winners[draw_idx]
            this.p_counts.innerHTML = `${dem_districts} Democratic and ${8-dem_districts} Republican districts.`
            draw_cmd(1, 1, -1, [rundata.X.pick(draw_idx)])
            this.needs_draw = false
        }
    }
    onMouseMove() {}
    onMouseLeave() {}
    onClick() {}
    onResize() {}
}