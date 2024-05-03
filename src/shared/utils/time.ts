const MAIN_THREAD = typeof window === "object";

export class Time {

    private static instance = new Time();

    private readonly nowFunction: () => number;

    constructor() {
        if (globalThis.performance && globalThis.performance.now) {
            this.nowFunction = this.dateBasedPerformanceNow.bind(this);
        }
        else {
            const date = new Date();
            this.nowFunction = date.getTime.bind(date);
        }
    }

    private dateBasedPerformanceNow(): number {
        return MAIN_THREAD ? performance.timing.navigationStart + performance.now() : Date.now();
    }

    public static get now(): number {
        return Time.instance.nowFunction();
    }
}
