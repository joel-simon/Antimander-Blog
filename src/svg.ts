const svgNS = "http://www.w3.org/2000/svg"

export function svg_circle(x, y, r): SVGElement {
    const circle = document.createElementNS(svgNS, "circle")
    circle.setAttributeNS(null,"cx", x);
    circle.setAttributeNS(null,"cy", y);
    circle.setAttributeNS(null,"r", r);
    circle.setAttributeNS(null,"fill","none");
    circle.setAttributeNS(null,"stroke","black");
    return circle
}

export function svg_line(x1, y1, x2, y2, r): SVGElement {
    const line = document.createElementNS(svgNS, "line")
    line.setAttributeNS(null,"x1", x1)
    line.setAttributeNS(null,"x2", x2)
    line.setAttributeNS(null,"y1", y1)
    line.setAttributeNS(null,"y2", y2)
    line.setAttributeNS(null,"stroke-width", r);
    line.setAttributeNS(null,"stroke","rgb(34, 34, 34)");
    line.setAttributeNS(null,"shape-rendering","crispedges");
    return line
}