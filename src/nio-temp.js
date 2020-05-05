// Add class to nav when it's sticky
const $nav = document.querySelector("nav");

const observer = new IntersectionObserver( 
    ([e]) => e.target.classList.toggle("atTop", e.intersectionRatio < 1),
    { threshold: [1] }
);

observer.observe($nav);


// Place sticky nav at correct height
const $cover = document.querySelector("#cover");
const $navOl = $nav.querySelector("ol");

function updateNavY() {
    const y = ($cover.offsetTop + $cover.offsetHeight) - ($navOl.offsetHeight);
//     console.log(y);
    $nav.style.setProperty("--overview-offset-top", `${y}px`);
}
window.onresize = updateNavY;
setTimeout(updateNavY, 100);





function toggleViewerSectionEmphasis($sections, isGradual) {    
    for ($section of $sections) {
        const   y = $section.getBoundingClientRect().top;
        
        if (isGradual) { // Fades in as you scroll
            const   threshhold = 160,
                    progress = Math.max(0, (y - threshhold)/(window.innerHeight-250)),
                    opacity = Math.max(.125, 1 - progress);
                    
            $section.style.opacity = opacity;
            $section.style.filter = `saturate(${opacity})`;
        } else { // Triggered on a threshhold
            const   threshhold = 220;
                    
            if (y <= threshhold) {
                $section.classList.add("focused");
                $section.classList.remove("defocused");
            } else {
                $section.classList.add("defocused");
                $section.classList.remove("focused");
            }
        }
    }
}

function scaleSymbol() {
    const   $header = document.querySelector("header"),
            $symbol = document.querySelector("header a.logo .symbol"),
            progress = Math.max(0, $header.getBoundingClientRect().top / 64);
//     console.log("SYMBOL",  document.scrollTop)
    $symbol.style.transform = `scale(${progress + 1})`;// translateY(${progress * 16}px)`;
}

function isCoverOnScreen() {   
    const   $overview = document.querySelector("#overview"),
            $body = document.querySelector("body");   
    
//  Has the user scrolled past the cover yet
    if ($overview.getBoundingClientRect().top <= 0) {
    //  If overview section has not yet scrolled past top of window
        $body.classList.add("cover-off-screen");
    } else {
        $body.classList.remove("cover-off-screen");
    }
}

function getCurrentSection() {
    const   $sections = document.querySelectorAll(".section"),
            $nav = document.querySelector("nav");
    let $current = $sections[0]; // Initial value
    
    for ($section of $sections) {
        const   y = $section.getBoundingClientRect().top,
                h = $section.offsetHeight,
                wh = window.innerHeight;
        if ((y <= wh/8) & (Math.abs(y) <= (h-(wh/8)))) {
            $current = $section
            $current.classList.add("current");
        } else {
            $section.classList.remove("current");
        }
    }
    
    if ($current.id && ($current.id != "cover")) {
        const $currentNavItem = $nav.querySelector("li#nav-" + $current.id);
        $currentNavItem.classList.add("current");
        
        for ($li of $nav.querySelectorAll("li:not(#nav-" + $current.id)) {
            $li.classList.remove("current");
        }
    } else {
        for ($li of $nav.querySelectorAll("li")) {
            $li.classList.remove("current");
        }
    }
}

function toggleScrollSnap() {
    const $current = document.querySelector(".section.current");
    
//  Enable scroll-snap class on body if you're in a viewer section
//  AND if the viewer section has more than 50% viewport height left to be scrolled
    if ($current.classList.contains("viewer") &&
            (
                Math.abs($section.getBoundingClientRect().top) <=
                ($section.offsetHeight-(window.innerHeight/2))
            )
        ) 
        {
        document.querySelector("body").classList.add("scroll-snap");
    } else {
        document.querySelector("body").classList.remove("scroll-snap");
    }
}

window.onscroll = function() {
    
//     console.log("SCROLLL")
    
    isCoverOnScreen();
    scaleSymbol();
    
//  Emphasize and deemphasize viewer text blocks as you scroll
    toggleViewerSectionEmphasis(
        document.querySelectorAll(".scroll-block"),
        isGradual = false
    );
    
    getCurrentSection();
    
    toggleScrollSnap();
}



// window.dispatchEvent(new CustomEvent('scroll'))
/*
    scaleSymbol();
    isCoverOnScreen();
*/



// Scroll snap workaround





