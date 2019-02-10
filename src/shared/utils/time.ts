export class Time {

    private static instance = new Time();

    private readonly nowFunction: () => number;

    constructor() {
        if (window.performance && window.performance.now) {
            this.nowFunction = this.dateBasedPerformanceNow.bind(this);
        }
        else {
            const date = new Date();
            this.nowFunction = date.getTime.bind(date);
        }
    }

    private dateBasedPerformanceNow(): number {
        return performance.timing.navigationStart + performance.now();
    }

    public static get now(): number {
        return Time.instance.nowFunction();
    }
}
