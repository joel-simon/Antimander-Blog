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