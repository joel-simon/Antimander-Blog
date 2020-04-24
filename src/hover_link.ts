window.onload = (event) => {
    const groups = {}
    document.querySelectorAll('.hover-link').forEach((div:HTMLElement) => {
        const name = div.dataset.hover_name
        if (!groups[name]) {
            groups[name] = [div]
        } else {
            groups[name].push(div)
        }
        div.onmouseenter = () => {
            groups[name].forEach(d => d.classList.add('l-hover'))
        }
        div.onmouseleave = () => {
            groups[name].forEach(d => d.classList.remove('l-hover'))
        }
    })
}