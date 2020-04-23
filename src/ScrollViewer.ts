import Viewer from './ResultViewer'
import { StateData, RunData, DrawCMD } from './datatypes'
import { clamp, inView } from './utils'

export default class extends Viewer {
    scroll_blocks: NodeListOf<HTMLElement>
    constructor(draw_cmd, container:HTMLElement, rundata: RunData) {
        super(draw_cmd, container, rundata)
        this.scroll_blocks = this.container.querySelectorAll('.scroll_block')
    }

    onScroll() {
        this._updatePosition()
        this._updateScrollBlocks()
    }

    _updatePosition() {
        const { viewer_div } = this
        const { top, bottom, height } = this.container.getBoundingClientRect()
        const stick_top_point = 0
        viewer_div.style.position = 'fixed'
        if (bottom < window.innerHeight) {
            viewer_div.style.top = (bottom - window.innerHeight) + 'px'
        } else if (top < stick_top_point) { // Stuck to view.
            viewer_div.style.top = stick_top_point+'px'
        } else {
            viewer_div.style.top = top + 'px' // Scroll normally when below.
        }
    }

    _updateScrollBlocks() {
        let most_middle = null
        const mobile = window.innerWidth < 800
        this.scroll_blocks.forEach(block => {
            const { top, height } = block.getBoundingClientRect()
            const y_perc = (top+height/2) / window.innerHeight
            const from_mid = clamp(Math.abs(y_perc - (mobile ? 0.75 : 0.5))*2, 0, 1)
            block.style.opacity = (1.0 - from_mid).toString()
            block.classList.remove('block_focus')
            if (most_middle == null || from_mid < most_middle[0]) {
                most_middle = [from_mid, block]
            }
        })
        if (most_middle) {
            most_middle[1].classList.add('block_focus')
        }
    }
}