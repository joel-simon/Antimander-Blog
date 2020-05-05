import image_promise from 'image-promise';
import ndarray from 'ndarray';
import npyjs from "npyjs";
// import { StateData, derp } from './datatypes';
import { RunData, NdArray } from './datatypes.ts'

export async function fetch_imagedata(src:string): Promise<NdArray> {
    /* Fetch an image data as a RGBA ndarray. */
    const img = await image_promise(src)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return ndarray(data, [ canvas.width, canvas.height, 4 ])
}

export function fetch_json(url:string, params?:object): Promise<any> {
    return fetch(url).then(resp => resp.ok ? resp.json() : null )
}

export function fetch_numpy(path:string): Promise<NdArray> {
    // Fetch a .npy binary as a ndarray typed array.
    const np = new npyjs()
    return new Promise((resolve, reject) => {
        np.load(path, ({ shape, data, dtype }) => {
            resolve(ndarray(data, shape))
        })
    })
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
    const { top, bottom } = el.getBoundingClientRect()
    return ((top <= 0 && bottom >= 0) ||
            (top <= window.innerHeight && bottom >= window.innerHeight))
}

export function percentSeen(el: HTMLElement): number {
    // Returns what percent of the screen height is taken by the element. Assumes full-width.
    const { top, bottom } = el.getBoundingClientRect()
    return (clamp(bottom, 0, window.innerHeight) - clamp(top, 0, window.innerHeight)) / window.innerHeight
}

export function queryAll(q:string, parent:HTMLElement|Document = document):HTMLElement[] {
    return Array.from(parent.querySelectorAll<HTMLElement>(q))
}

export function query(q:string, parent:HTMLElement|Document = document):HTMLElement {
    return parent.querySelector<HTMLElement>(q)
}
// export function max(arr: any[], cmp: Function) {
//     return arr.sort(a, bcmp)[0]
// }