// Add class to nav when it's sticky
const nav = document.querySelector('nav');
const observer = new IntersectionObserver( 
    ([e]) => e.target.classList.toggle('atTop', e.intersectionRatio < 1),
    { threshold: [1] }
);

observer.observe(nav);