import { StateData, RunData, DrawCMD } from './datatypes'
import Viewer from './ResultViewer'
import { clamp, range } from './utils'
import ndarray from 'ndarray'

export default class extends Viewer {
    p_counts: HTMLInputElement
    sorted_idxs: number[]
    draw_idx: number
    winners: Uint8Array
    sliders: NodeListOf<any>
    constructor(draw_cmd, container:HTMLElement, rundata: RunData) {
        super(draw_cmd, container, rundata, false)
        
        this.draw_idx = null
        this.p_counts = container.querySelector('p.counts')
        this.sliders = container.querySelectorAll('.slider') as NodeListOf<any>
        
        this.sliders.forEach(slider => {
            const { metric } = slider.dataset
            slider.metric_index = rundata.config.metrics.indexOf(metric)
            slider.sorted_idxs = range(this.values.length).sort((i, j) => {
                return this.values[j][metric] - this.values[i][metric]
            })
            slider.oninput = () => this._udpateSlider(slider)
        })
        this._udpateSlider(this.sliders[0])
        // this.draw_idx = this.sorted_idxs[Math.floor(rundata.X.shape[0] / 2)]
        // this.slider = container.querySelector('.slider')

        this.winners = this._calculateWinners(rundata)  

    }
    _udpateSlider(slider) {
        const v = parseFloat(slider.value)
        this.draw_idx = slider.sorted_idxs[Math.floor(v * this.values.length)]
        this.needs_draw = true
        this.sliders.forEach(_slider => {
            if (slider != _slider) {
                const other_idx = _slider.sorted_idxs.indexOf(this.draw_idx)
                _slider.value = (other_idx / this.values.length).toString()
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