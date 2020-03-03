export interface RunData {
    config: any;
    values: number[][];
    solutions: number[][];
    metrics_data: any;
}

export interface StateData {
    voters: [ number, number ][];
    population: number[];
}