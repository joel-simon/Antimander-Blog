import { clamp, inView, queryAll } from './utils'
let active_block = null
let active_block_d = 0
let lastScrollTop = window.pageYOffset
type ScrollSection = HTMLElement & {turn_on: Function, turn_off: Function }

const scroll_blocks = queryAll('section.snap') as ScrollSection[]

window.addEventListener("scroll", () => {    
    const last_active = active_block
    const scroll_down = window.pageYOffset > lastScrollTop
    lastScrollTop = window.pageYOffset
    
    active_block = null
    const highlight_height = (window.innerWidth < 768) ? 0.75 : 0.5
    scroll_blocks.forEach(block => {
        const { top, height } = block.getBoundingClientRect()
        const y_perc = (top+height/2) / window.innerHeight
        const from_mid = clamp(Math.abs(y_perc - highlight_height)*2, 0, 1)        
        if (active_block == null || from_mid < active_block_d) {
            active_block = block
            active_block_d = from_mid        
        }
    })

    if (active_block && last_active != active_block) {
        active_block.classList.remove("defocused")
        active_block.classList.add("focused")
        if (last_active) {
            last_active.classList.add("defocused")
            last_active.classList.remove("focused")
            if (!scroll_down && last_active.turn_off) {
                last_active.turn_off()
            }
        }
        if (active_block.turn_on && scroll_down) {
            active_block.turn_on()
        }
    }
})