// import Viewer from './ResultViewer'
// import { StateData, RunData, DrawCMD } from './datatypes'
import { clamp, inView } from './utils'

interface sdata {
    section: HTMLElement;
    scroll_blocks:  NodeListOf<HTMLElement>;
}

function updatePositions({ section, scroll_blocks }: sdata) {
    const viewer = section.querySelector('.district-viewer') as HTMLElement
    const { top, bottom, height } = section.getBoundingClientRect()
    const stick_top_point = 0
    viewer.style.position = 'fixed'
    if (bottom < window.innerHeight) {
        viewer.style.top = (bottom - window.innerHeight) + 'px'
    } else if (top < stick_top_point) { // Stuck to view.
        viewer.style.top = stick_top_point+'px'
    } else {
        viewer.style.top = top + 'px' // Scroll normally when below.
    }
}

function updateScrollBlocks({ section, scroll_blocks }: sdata) {
    let most_middle = null
    const mobile = window.innerWidth < 800
    scroll_blocks.forEach(block => {
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

let last_scroll = null
const section_divs: sdata[] = []
document.querySelectorAll('.section.viewer_row').forEach((section: HTMLElement) => {
    const scroll_blocks = section.querySelectorAll('.scroll_block') as NodeListOf<HTMLElement>
    section_divs.push({ section, scroll_blocks })
})
function update() {
    if (last_scroll != window.scrollY) {
        section_divs.forEach(({ section, scroll_blocks }) => {
            // if (inView(section)) {
            updatePositions({ section, scroll_blocks })
            updateScrollBlocks({ section, scroll_blocks })
            // }
        })
        last_scroll = window.scrollY
    }
    window.requestAnimationFrame(update)
}
update()
