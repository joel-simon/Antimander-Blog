/*
Add class to these elements when they are in sticky state
*/
function detectWhenSticky($elements) {
/*
    const observer = new IntersectionObserver( 
        ([e]) =>
            e.target.classList.toggle("at-top", e.intersectionRatio < 1),
        {
            threshold: [1]
        }
    );
*/
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            entry.target.classList.toggle("sticky");
        }, {
//             rootMargin: "0px 0px 0px",
            threshhold: 1
        });
    });

    $elements.forEach($element => {
        observer.observe($element);
    })
}


/*
Place nav at correct height on the cover
*/
function updateNavY() {
    const   $nav    = document.querySelector("nav"),
            $cover  = document.querySelector("#cover"),
            $navOl  = $nav.querySelector("ol"),
            y       = ($cover.offsetTop + $cover.offsetHeight) - ($navOl.offsetHeight);
          
    $nav.style.setProperty("--overview-offset-top", `${y}px`);
}


/*
Emphasize sections on scroll
*/
function toggleViewerSectionEmphasis($sections, isGradual) {    
    for ($section of $sections) {
        const y = $section.getBoundingClientRect().top;

        if (isGradual) { 
        //  Fades in as you scroll
            const   threshhold  = 160,
                    progress    = Math.max(0,
                            (y - threshhold)/(window.innerHeight-250)
                        ),
                    opacity     = Math.max(.125, 1 - progress);
                    
            $section.style.opacity = opacity;
            $section.style.filter = `saturate(${opacity})`;
        } else {
        //  Triggered on a threshhold
            const   threshhold  = 220;
                    
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


/*
Scale the symbol proportionate to how far the header
has traveled to the top of the screen.
*/
function scaleSymbol() {
    const   $header     = document.querySelector("header"),
            $symbol     = document.querySelector("header a.logo .symbol"),
            progress    = Math.max(0, $header.getBoundingClientRect().top / 64);
    
//  Only execute transform if this CSS variable is set to true
    if (JSON.parse(getComputedStyle($symbol).getPropertyValue("--can-scale"))) {
        $symbol.style.transform = `scale(${progress + 1})`;
    }
}


/*
Toggle class on body when cover is on screen
*/
function isCoverOnScreen() {   
    const $overview = document.querySelector("#overview");
    
//  Has the user scrolled past the cover yet
    if ($overview.getBoundingClientRect().top <= 0) {
    //  If overview section has not yet scrolled past top of window
        document.querySelector("body").classList.add("cover-off-screen");
    } else {
        document.querySelector("body").classList.remove("cover-off-screen");
        document.querySelector(".menu-inner").classList.remove("open");
    }
}


/*
Based on whether section is in view, give it current class
and remove all others's current classses.
*/
function getCurrentSection() {
    const   $sections   = document.querySelectorAll(".section"),
            $nav        = document.querySelector("nav");
    let     $current    = $sections[0]; // Initial value
    
//  This should be an observer…
    for ($section of $sections) {
        const   y   = $section.getBoundingClientRect().top,
                h   = $section.offsetHeight,
                wh  = window.innerHeight;
        if ((y <= wh/8) & (Math.abs(y) <= (h-(wh/8)))) {
            $current = $section
            $current.classList.add("current");
        } else {
            $section.classList.remove("current");
        }
    }
    
    if ($current.id && ($current.id != "cover")) {
        const $currentNavItem = $nav.querySelector("li#nav-" + $current.id);
    //  If there's a corresponding nav item, give it current class
        $currentNavItem?.classList.add("current");

    //  Remove current class from all other nav lis
        $nav.querySelectorAll("li:not(#nav-" + $current.id + ")").forEach($li =>
            $li.classList.remove("current")
        );
    } else {
    //  Remove current class from all  nav lis
        $nav.querySelectorAll("li").forEach($li =>
            $li.classList.remove("current")
        );
    }
}


/*
function toggleScrollSnap() {
    const $current = document.querySelector(".section.current");
    
//  Enable scroll-snap class on body if you're in a viewer section
//  AND if the viewer section has more than 50% viewport height left to be scrolled
    if ($current.classList.contains("viewer") &&
            (
                Math.abs($current.getBoundingClientRect().top + 4000) <=
                ($current.offsetHeight-(window.innerHeight))
            )
        ) 
        {
            document.querySelector("body").classList.add("scroll-snap");
//         document.documentElement.classList.add("scroll-snap");
    } else {
        document.querySelector("body").classList.remove("scroll-snap");
//         document.documentElement.classList.remove("scroll-snap");
        
    }
}
*/


/*
Toggle open class on nav menu sections when clicking button
*/
function setupNavMenuButton() {
    const   $button     = document.querySelector("input#toggle-menu"),
            $menuInners = document.querySelectorAll(".menu-inner");
    
    $button.onclick = () => {
        $menuInners.forEach($menuInner =>
            $menuInner.classList.toggle("open")
        );
    };
}


/*
————————————————————————————————————————————————————————————————————————————————
*/


window.addEventListener("load",     setupNavMenuButton);
window.addEventListener("load",     updateNavY);
window.addEventListener("load",     () => {
    detectWhenSticky([
        document.querySelector("header"),
        document.querySelector("nav")
    ]);
});

window.addEventListener("resize",   updateNavY);

window.addEventListener("scroll",   isCoverOnScreen);
window.addEventListener("scroll",   scaleSymbol);
window.addEventListener("scroll",   getCurrentSection);
window.addEventListener("scroll",   () => {
    toggleViewerSectionEmphasis(
        document.querySelectorAll("section.snap"),
        isGradual = false
    );
});