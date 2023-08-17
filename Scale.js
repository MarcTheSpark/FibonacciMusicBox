class Scale {
    constructor(startPitch, intervals) {
        this.startPitch = startPitch;
        this.octave = intervals[intervals.length - 1]; // get the last interval
        this.intervals = [0].concat(intervals.slice(0, intervals.length - 1));
    }

    get length() {
        return this.intervals.length;
    }

    degreeToPitch(degree) {
        // Compute how many times the interval pattern repeats
        let cycles = Math.floor(degree / this.length);

        // Compute the index within the current cycle
        let index = degree >= 0 ? degree % this.length : (degree % this.length + this.length) % this.length;

        // Calculate the total pitch shift
        let shift = this.intervals[index] + this.octave * cycles;

        return this.startPitch + shift;
    }

    get [Symbol.iterator]() {
        return this.values.bind(this);
    }

    *values() {
        for (let i = 0;; i++) {
            yield this.degreeToPitch(i);
        }
    }

    get(degree) {
        return this.degreeToPitch(degree);
    }
}


var scaleIntervals = {
    "chromatic": [1],
    "major": [2, 4, 5, 7, 9, 11, 12],
    "minor": [2, 3, 5, 7, 8, 10, 12],
    "pentatonic": [2, 4, 7, 9, 12],
    "octatonic": [1, 3],
    "harmonic series": [12.0, 19.02, 24.0, 27.86, 31.02, 33.69, 36.0, 38.04, 39.86, 41.51, 43.02, 44.41, 45.69, 46.88, 48.0, 49.05, 50.04, 50.98, 51.86, 52.71, 53.51, 54.28, 55.02, 55.73, 56.41, 57.06, 57.69, 58.3, 58.88, 59.45, 60.0, 60.53, 61.05, 61.55, 62.04, 62.51, 62.98, 63.42, 63.86, 64.29, 64.71, 65.12, 65.51, 65.9, 66.28, 66.66, 67.02, 67.38, 67.73, 68.07, 68.41, 68.74, 69.06, 69.38, 69.69, 69.99, 70.3, 70.59, 70.88, 71.17, 71.45, 71.73, 72.0, 72.27, 72.53, 72.79, 73.05, 73.3, 73.55, 73.8, 74.04, 74.28, 74.51, 74.75, 74.98, 75.2, 75.42, 75.65, 75.86, 76.08, 76.29, 76.5, 76.71, 76.91, 77.12, 77.32, 77.51, 77.71, 77.9, 78.09, 78.28, 78.47, 78.66, 78.84, 79.02, 79.2, 79.38, 79.55, 79.73],
    "custom": [1]
};
