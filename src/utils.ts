import image_promise from 'image-promise';
import ndarray from 'ndarray';

export async function image_data(src: string) {
    /*  Given a url, return the image data as a RGBA ndarray.
    */
    const img = await image_promise(src)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return ndarray(data, [ canvas.width, canvas.height, 4 ])
}

export function fetch_json(url: string, params?:object): Promise<any> {
    return fetch(url).then(resp => resp.ok ? resp.json() : null )
}

export function sum(arr: number[]):number {
    return arr.reduce((a, b) => a+b)
}

export function mean(arr: number[]):number {
    return sum(arr) / arr.length
}

export function sample(arr: any[], n: number) {
    let shuffled = arr.slice(0), i = arr.length, temp, index
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, n)
}

export function clamp(v:number, min:number, max:number):number {
    return Math.min(max, Math.max(min, v))
}

export function range(n: number):number[] {
    return new Array(n).fill(0).map((_, i) => i)
}

export function inView(el: HTMLElement): boolean {
    const { top, left, bottom, right } = el.getBoundingClientRect()
    // console.log({ top, left, bottom, right });
    return (
        (top < 0 && bottom > 0) ||
        (top < window.innerHeight && bottom > window.innerHeight)
    )
}

// function norm(array) {
//     let [min, max] = [Infinity, -Infinity]
//     for (const v of array) {
//         min = v < min ? v : min
//         max = v > max ? v : min
//     }
//     // const min = Math.min(...array.filter(x => !isNaN(x)))
//     // const max = Math.max(...array.filter(x => !isNaN(x)))
//     return array.map(x => (x-min) / (max-min))
// }
