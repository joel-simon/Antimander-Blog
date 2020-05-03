// NAV
const $nav = document.querySelector("nav");

// Add class to nav when it's sticky
const observer = new IntersectionObserver( 
    ([e]) => e.target.classList.toggle("atTop", e.intersectionRatio < 1),
    { threshold: [1] }
);

observer.observe($nav);


// Place sticky nav at correct height
const $overview = document.querySelector("#overview");
const $header = document.querySelector("header");
const $cover = document.querySelector("#cover");
const $navOl = $nav.querySelector("ol");
function updateNavY() {
    console.log($navOl.offsetHeight);
    const y = ($cover.offsetTop + $cover.offsetHeight) - ($navOl.offsetHeight);
    $nav.style.setProperty("--overview-offset-top", `${y}px`);
}
window.onresize = updateNavY;
/*
window.dispatchEvent(new Event('resize'));
*/
setTimeout(updateNavY, 100);

// updateNavY();
/*


// Get an element's distance from the top of the page
var getElemDistance = function ( elem ) {
    var location = 0;
    if (elem.offsetParent) {
        do {
            location += elem.offsetTop;
            elem = elem.offsetParent;
        } while (elem);
    }
    return location >= 0 ? location : 0;
};
var elem = $overview;

console.log(getElemDistance( elem ))
*/