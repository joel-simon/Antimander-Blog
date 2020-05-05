import image_promise from 'image-promise'
import ndarray from 'ndarray'
import npyjs from "./lib/npy.js"
import JsZip from 'jszip'
import { NdArray } from './datatypes'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

export async function fetch_imagedata(src:string): Promise<NdArray> {
    /* Fetch an image data as a RGBA ndarray. */
    console.time('fetch_imagedata')
    const img = await image_promise(src)
    img.crossOrigin = 'Anonymous'
    
    // console.log(img.naturalWidth, img.naturalHeight, img.width, img.height, canvas.width, canvas.height);
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 3; i < data.length; i+=4) {
        data[i] = 255;
    }
    // console.log(src, data.length, Array.from(data).reduce((a, b) => a+b, 0));
    console.timeEnd('fetch_imagedata')
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

export async function fetch_npy_zip(path: string): Promise<NdArray> {
    console.time('fetch_npy_zip')
    const np = new npyjs()
    const zipped = await fetch(path).then(d => d.arrayBuffer())
    const { files } = await JsZip.loadAsync(zipped)
    const unzip = await (Object.values(files)[0] as any).async('arraybuffer')
    const { shape, data } = np.parse(unzip)
    console.timeEnd('fetch_npy_zip')
    return ndarray(data, shape)
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