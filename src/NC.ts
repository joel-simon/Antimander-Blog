
import { RunData, DrawCMD, NdArray } from './datatypes'
import { fetch_rundata, calc_district_stats } from './viewer_utils'
import { fetch_numpy } from './utils'
import * as array_utils from './array_utils'

const F_2011 = {'polsby popper': 0.6708440184593201, 'competitiveness': 0.5641258358955383, 'efficiency gap': 0.15245412290096283}
const F_2016 = {'polsby popper': 0.5016661286354065, 'competitiveness': 0.38593238592147827, 'efficiency gap': 0.14154845476150513}

let cached: null|RunData = null

export async function fetch_NC(): Promise<RunData> {
    if (cached) return cached
    console.time('fetch_NC')
    const [rundata, x_2011, x_2016]: [RunData, NdArray, NdArray] = await Promise.all([
        fetch_rundata('NC', 3),
        fetch_numpy('data/NC/NC_real_districts_11.npy'),
        fetch_numpy('data/NC/NC_real_districts_16.npy')
    ])
    rundata.X = array_utils.ndappend(rundata.X, x_2011)
    rundata.X = array_utils.ndappend(rundata.X, x_2016)
    rundata.F = array_utils.append(rundata.F, rundata.config.metrics.map(name => F_2011[name]))
    rundata.F = array_utils.append(rundata.F, rundata.config.metrics.map(name => F_2016[name]))
    rundata.colors = {}
    rundata.colors[rundata.X.shape[0] - 2] = 'red'
    rundata.colors[rundata.X.shape[0] - 2] = 'blue'
    rundata.config.metrics = ["compactness", "fairness", "competitiveness"]
    rundata.district_stats = calc_district_stats(rundata)
    cached = rundata
    console.timeEnd('fetch_NC')
    return rundata
}