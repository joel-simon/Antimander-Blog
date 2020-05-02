import { NdArray } from './datatypes'
import ndarray from 'ndarray'

// I miss numpy :(
const arrtypes = {
    "int8": Int8Array,
    "int16": Int16Array,
    "int32": Int32Array,
    "uint8": Uint8Array,
    "uint16": Uint16Array,
    "uint32": Uint32Array,
    "bigint64": BigInt64Array,
    "biguint64": BigUint64Array,
    "float32": Float32Array,
    "float64": Float64Array,
}

export function minmax(F: NdArray) {
    const mins = new Array(F.shape[1]).fill(Infinity)
    const maxs = new Array(F.shape[1]).fill(-Infinity)
    for (let i = 0; i < F.shape[0]; i++) {
        for (let j = 0; j < F.shape[1]; j++) {
            mins[j] = Math.min(mins[j], F.get(i, j))
            maxs[j] = Math.max(maxs[j], F.get(i, j))
        }        
    }
    return { mins, maxs }
}

export function append(a: NdArray, b: number[]): NdArray {
    if (b.length != a.shape[1]) {
        throw `Invalid array shapes. ${a.shape}, ${b.length}`;
    }
    const c = ndarray(new arrtypes[a.dtype](a.size + b.length), 
                      [a.shape[0]+1, a.shape[1]])
    c.data.set(a.data, 0)
    c.data.set(b, a.data.length)
    return c
}

// const a = ndarray(new Uint8Array([3,3,3,3]), [2,2])
// console.log(array_append(a, [4, 4]))
