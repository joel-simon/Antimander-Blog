// NAV
const $nav = document.querySelector("nav");

// Add class to nav when it's sticky
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
    console.log(y);
    $nav.style.setProperty("--overview-offset-top", `${y}px`);
}
window.onresize = updateNavY;
setTimeout(updateNavY, 100);



// Scroll snap workaround
document.querySelector("body").classList.add("scroll-snap");



// Highlight viewer sections
const $sections = document.querySelectorAll(".viewer .scroll-block");


window.onscroll = function() {
    for ($section of $sections) {
        // Gradient version
/*
        const   y = $section.getBoundingClientRect().top,
                threshhold = 160,
                progress = Math.max(0, (y - threshhold)/(window.innerHeight-250)),
                opacity = Math.max(.125, 1 - progress);
                
        $section.style.opacity = opacity;
        $section.style.filter = `saturate(${opacity})`;
*/
        const   y = $section.getBoundingClientRect().top,
                threshhold = 220;
        if (y <= threshhold) {
            $section.classList.add("focused");
            $section.classList.remove("defocused");
        } else {
            $section.classList.add("defocused");
            $section.classList.remove("focused");
        }
    }
}

