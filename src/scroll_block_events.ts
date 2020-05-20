import { query, queryAll, range } from './utils'
import { RunData } from './datatypes'
import { X_real, F_real } from './real_data'
import * as array_utils from './array_utils'
import ResultViewer from './ResultViewer'
import { DrawController } from './draw_controller'
import { fetch_rundata } from './viewer_utils'
import { fetch_NC } from './NC'

enum ScrollState { Above, Below, Current, None }
type ScrollSection = HTMLElement & {
    on_above?: Function,
    on_below?: Function,
    on_current?: Function,
    state: ScrollState
}
type ViewerSlider = HTMLInputElement & {metric_index: number, sorted_idxs: number[] }

function set_real_map(viewer, sliders:ViewerSlider[]) {
    const n = viewer.rundata.X.shape[0]
    viewer.setCurrent([n-1])
    for (const slider of sliders) {
        const m_idx = slider.metric_index
        slider.value = (slider.sorted_idxs.indexOf(n-1) / viewer.rundata.X.shape[0]).toString()
    }
}

function update_viewer_from_sliders(viewer, slider, sliders) {
    const v = Math.min(parseFloat(slider.value), .99)
    const n = viewer.rundata.X.shape[0]
    const draw_idx = slider.sorted_idxs[Math.floor(v * n)]
    viewer.setCurrent([ draw_idx ])
    sliders.forEach(_slider => {
        const m_idx = _slider.metric_index
        if (slider != _slider) {
            _slider.value = (_slider.sorted_idxs.indexOf(draw_idx) / viewer.rundata.X.shape[0]).toString()
        }
    })            
}

function bind_bias_tests(viewer:ResultViewer, draw_controller:DrawController) {
    // Initialize the section that contains optimization for bias.
    // This function bind the images in the text column to update the viewer.
    queryAll('.map_opts img', viewer.container).forEach(img => {
        const { datapath, stage } = img.dataset
        img.onclick = async () => {
            let rundata = await fetch_rundata(datapath, +stage)
            rundata.config.metrics = ["compactness", "dem advantage", "rep advantage"]
            const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
            viewer.setData(draw_cmd, rundata, ['rep advantage'])
            viewer.setShape(3, 3)
        }
    })
}

function bind_sliders(viewer, sliders) {
    // The sliders for each of the three metrics.
    for (const slider of sliders) {
        const { metric } = slider.dataset
        slider.metric_index = viewer.rundata.config.metrics.indexOf(metric)        
        slider.sorted_idxs = range(viewer.values.length).sort((i, j) => {
            return viewer.values[i][metric] - viewer.values[j][metric]
        })
        slider.oninput = () => {
            update_viewer_from_sliders(viewer, slider, sliders)
        }
    }
    query('.set_current').onclick = () => set_real_map(viewer, sliders)
}

function bind_scrolling(scroll_blocks) {
    let active_block = null
    let active_block_d = 0
    let lastScrollTop = window.pageYOffset
    
    scroll_blocks.forEach(block => {
        block.state = ScrollState.None
        block.classList.add("defocused")
    })

    function onscroll() {
        // console.time('scroll')
        const last_active = active_block
        active_block = null

        // Process highlighting and set current.
        const highlight_y = (window.innerWidth < 768) ? window.innerHeight*.85 : 400
        scroll_blocks.forEach(block => {
            const { top, height } = block.getBoundingClientRect()
            const y = top + height/2
            // const y_perc = (top+height/2) / window.innerHeight
            // const from_mid = clamp(Math.abs(y - highlight_y)*2, 0, 1)        
            const dist = Math.abs(y - highlight_y)
            if (active_block == null || dist < active_block_d) {
                active_block = block
                active_block_d = dist        
            }
        })
        // Handle events.
        if (active_block != last_active) {
            // console.log('new active', active_block);
            scroll_blocks.forEach(block => {
                const { top, height } = block.getBoundingClientRect()
                const y = top + height/2
                if (block == active_block && block.state != ScrollState.Current) {
                    if (block.on_current) {
                        block.on_current()
                    }
                    block.state = ScrollState.Current
                } else if (y > highlight_y && (block != active_block) && block.state != ScrollState.Below) {                    
                    if (block.on_below && block.state != ScrollState.None) {
                        block.on_below()
                    }
                    block.state = ScrollState.Below
                } else if (y < highlight_y && (block != active_block) && block.state != ScrollState.Above) {
                    if (block.on_above) {
                        block.on_above()
                    }
                    block.state = ScrollState.Above
                }
            })
            if (last_active) {
                last_active.classList.add("defocused")
                last_active.classList.remove("focused")
            }
            if (active_block) {
                active_block.classList.remove("defocused")
                active_block.classList.add("focused")
            }
        }
        // console.timeEnd('scroll')
    }    
    window.addEventListener("scroll", onscroll)
    // if window.scrollY
    onscroll()
}

function start_animate(viewer:ResultViewer): NodeJS.Timeout {
    return setInterval(() => {
        const n = viewer.rundata.X.shape[0]
        viewer.setCurrent([ Math.floor(Math.random() * n) ])
    }, 500)
}

export default function(viewer:ResultViewer, draw_controller:DrawController) {
    const orig_rundata = viewer.rundata
    const orig_drwcmd = viewer.draw_cmd
    const scroll_blocks = queryAll('section.snap') as ScrollSection[]
    const sliders = queryAll('.slider', viewer.container) as ViewerSlider[]
    bind_sliders(viewer, sliders)
    set_real_map(viewer, sliders)

    {
        let anim_interval
        const sp = query('#cover section.snap') as ScrollSection
        sp.on_current = () => {
            console.log('cover active');
            viewer.setShape(1,1)
            viewer.setData(orig_drwcmd, orig_rundata)
            anim_interval = start_animate(viewer)
        }
        sp.on_above = () => {
            console.log('cover above');
            clearInterval(anim_interval)
        }
    }
    {  
        // Switches from animation to showing real WI.                
        const sp = query('#set-WI') as ScrollSection
        sp.on_current  = () => {
            console.log('turn on set-WI');
            viewer.setShape(1, 1)
            viewer.setData(orig_drwcmd, orig_rundata)
            set_real_map(viewer, sliders)
        }
    }
    {
        // Show the parallel coordinates.
        const pc = query('.parcoords', viewer.container)
        const vc = query('.view_count', viewer.container)
        const sp = document.getElementById('show_parcoords_pt1') as ScrollSection
        // const canvas = query('.main_canvas') as HTMLCanvasElement
        // if (window.innerWidth < 768 ) {
        //     pc.style.display = 'none'
        // }    
        sp.on_current = sp.on_above = () => {
            console.log('show PARRCOR');
            
            pc.style.opacity = '1'
            if (window.innerWidth < 768 ) {
                pc.style.display = 'block'
                viewer.setShape(4, 4)
            } else {
                viewer.setShape(3, 3)
                vc.style.opacity = '1'
            }
            // Remove the temporary image.
            // query('img.main_canvas').classList.add('hidden')
            // query('canvas.main_canvas').classList.remove('hidden')
        }

        sp.on_below = () => {
            pc.style.opacity = '0'
            vc.style.opacity = '0'
            viewer.setShape(1, 1)
            viewer.setData(orig_drwcmd, orig_rundata) // If a user scrolls back to the cover, make sure WI is showing
        //     if (window.innerWidth < 768 ) {
        //         pc.style.display = 'none'
        //     }
        //     // query('img.main_canvas').classList.remove('hidden')
        //     // query('canvas.main_canvas').classList.add('hidden')
        }
    }
    {
        // Show North Carolina
        const sp = query('#NC') as ScrollSection
        sp.on_current = async () => {
            console.log('turn on NC')
            let rundata = await fetch_NC()
            // rundata.config.metrics = ["compactness", "dem advantage", "rep advantage"]
            const draw_cmd = draw_controller.createViewerDrawCmd(rundata, .5)
            viewer.setData(draw_cmd, rundata)
            viewer.setShape(2, 4)
            const n = rundata.X.shape[0]
            query('.nc-view-2011', sp).onclick = () => viewer.setCurrent([n-2])
            query('.nc-view-2016', sp).onclick = () => viewer.setCurrent([n-1])
        }
        sp.on_below = () => {
            viewer.setShape(3, 3)
            viewer.setData(orig_drwcmd, orig_rundata)
        }
        
    }


    bind_bias_tests(viewer, draw_controller)
    bind_scrolling(scroll_blocks)
}


