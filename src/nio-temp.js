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
    if ($overview.getBoundingClientRect().top <= 32) {
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
//         console.log($section.id, $section.getBoundingClientRect().top, $section.offsetHeight);
        const   y = $section.getBoundingClientRect().top,
                h = $section.offsetHeight,
                wh = window.innerHeight;
//         if ((y <= wh/4) & (Math.abs(y) <= (h-(wh/4)))) {
        if ((y <= 0) & (Math.abs(y) <= h)) {
            $current = $section
//             console.log("INVIEW", $section.id);
        } else {
//             console.log("NOTINVIEW", $section.id);
        }
//         $current = $section;
    }
//     $nav.querySelector(`li:not(#${$current.id})`).classList.remove("current");
//     $nav.querySelector(`li#${$current.id}`).classList.add("current");
    if ($current.id && ($current.id != "cover")) {
        console.log($current.id);
        const $currentNavItem = $nav.querySelector("li#nav-" + $current.id);
        $currentNavItem.classList.add("current");
        
        for ($li of $nav.querySelectorAll("li:not(#nav-" + $current.id)) {
            $li.classList.remove("current");
        }
//         console.log("wow", $nav.querySelector("li#" + $current.id));
    } else {
        for ($li of $nav.querySelectorAll("li")) {
            $li.classList.remove("current");
        }
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
}



// window.dispatchEvent(new CustomEvent('scroll'))
/*
    scaleSymbol();
    isCoverOnScreen();
*/



// Scroll snap workaround
// document.querySelector("body").classList.add("scroll-snap");




