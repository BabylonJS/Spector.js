namespace SPECTOR {
    export interface ITime {
        readonly now: number;
    }

    export type TimeConstructor = new () => ITime;
}

namespace SPECTOR.Utils {

    export class Time implements ITime {

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

        public get now(): number {
            return this.nowFunction();
        }
    }
}
