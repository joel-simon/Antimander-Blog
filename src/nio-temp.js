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


/*
// Scroll snap workaround
document.querySelector("body").classList.add("scroll-snap");
*/


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

    $symbol.style.transform = `scale(${progress + 1})`;// translateY(${progress * 16}px)`;
}

function isCoverOnScreen() {   
    const   $overview = document.querySelector("#overview"),
            $body = document.querySelector("body");   
    
//  Has the user scrolled past the cover yet
    if ($overview.getBoundingClientRect().top >= 32) {
    //  If overview section has not yet scrolled past top of window
        $body.classList.add("cover-on-screen");
    } else {
        $body.classList.remove("cover-on-screen");
    }
}

window.onscroll = function() {
    scaleSymbol();
    
    isCoverOnScreen();
    
//  Emphasize and deemphasize viewer text blocks as you scroll
    toggleViewerSectionEmphasis(
        document.querySelectorAll(".scroll-block"),
        isGradual = true
    );
}