export class Time {

    private static instance = new Time();

    private readonly nowFunction: () => number;

    constructor() {
        if (typeof performance !== "undefined" && performance.now) {
            this.nowFunction = () => performance.now();
        }
        else {
            const date = new Date();
            this.nowFunction = date.getTime.bind(date);
        }
    }

    public static get now(): number {
        return Time.instance.nowFunction();
    }
}
