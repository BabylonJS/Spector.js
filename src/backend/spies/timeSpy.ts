// tslint:disable:ban-types
// tslint:disable:only-arrow-functions

namespace SPECTOR {

    export interface ITimeSpy {
        onFrameStart: IEvent<ITimeSpy>;
        onFrameEnd: IEvent<ITimeSpy>;
        onError: IEvent<string>;
        playNextFrame(): void;
        changeSpeedRatio(ratio: number): void;
        getFps(): number;
    }

    export interface ITimeSpyOptions {
        spiedWindow?: { [name: string]: Function };
        eventConstructor: EventConstructor;
        timeConstructor: TimeConstructor;
    }

    export type TimeSpyConstructor = {
        new(options: ITimeSpyOptions, logger: ILogger): ITimeSpy;
    };
}

namespace SPECTOR.Spies {
    export class TimeSpy implements ITimeSpy {
        private static readonly requestAnimationFrameFunctions = ["requestAnimationFrame",
            "msRequestAnimationFrame",
            "webkitRequestAnimationFrame",
            "mozRequestAnimationFrame",
            "oRequestAnimationFrame",
        ];

        private static readonly setTimerFunctions = ["setTimeout",
            "setInterval",
        ];

        private static readonly setTimerCommonValues = [0, 15, 16, 33, 32, 40];

        private static readonly fpsWindowSize = 60;

        public readonly onFrameStart: IEvent<ITimeSpy>;
        public readonly onFrameEnd: IEvent<ITimeSpy>;
        public readonly onError: IEvent<string>;

        private readonly spiedWindow: { [name: string]: any };
        private readonly time: ITime;
        private readonly lastSixtyFramesDuration: number[];

        private lastSixtyFramesCurrentIndex: number;
        private lastSixtyFramesPreviousStart: number;
        private lastFrame: number;
        private speedRatio: number;
        private willPlayNextFrame: boolean;

        constructor(private readonly options: ITimeSpyOptions, private readonly logger: ILogger) {
            this.spiedWindow = options.spiedWindow || window;
            this.lastFrame = 0;

            this.speedRatio = 1;
            this.willPlayNextFrame = false;
            this.onFrameStart = new options.eventConstructor<ITimeSpy>();
            this.onFrameEnd = new options.eventConstructor<ITimeSpy>();
            this.onError = new options.eventConstructor<string>();
            this.time = new this.options.timeConstructor();

            this.lastSixtyFramesDuration = [];
            this.lastSixtyFramesCurrentIndex = 0;
            this.lastSixtyFramesPreviousStart = 0;
            for (let i = 0; i < TimeSpy.fpsWindowSize; i++) {
                this.lastSixtyFramesDuration[i] = 0;
            }

            this.init();
        }

        public playNextFrame(): void {
            this.willPlayNextFrame = true;
        }

        public changeSpeedRatio(ratio: number): void {
            this.speedRatio = ratio;
        }

        public getFps(): number {
            let accumulator = 0;
            for (let i = 0; i < TimeSpy.fpsWindowSize; i++) {
                accumulator += this.lastSixtyFramesDuration[i];
            }

            if (accumulator === 0) {
                return 0;
            }
            return 1000 * 60 / accumulator;
        }

        private init(): void {
            for (const Spy of TimeSpy.requestAnimationFrameFunctions) {
                this.spyRequestAnimationFrame(Spy, this.spiedWindow);
            }
            for (const Spy of TimeSpy.setTimerFunctions) {
                this.spySetTimer(Spy);
            }

            if (this.spiedWindow["VRDisplay"]) {
                this.spiedWindow.addEventListener("vrdisplaypresentchange", (event: any) => {
                    this.spyRequestAnimationFrame("requestAnimationFrame", event.display);
                });
            }
        }

        private spyRequestAnimationFrame(functionName: string, owner: any): void {
            // Needs both this.
            // tslint:disable-next-line
            const self = this;
            OriginFunctionHelper.storeOriginFunction(owner, functionName);
            owner[functionName] = function () {
                const callback = arguments[0];
                const onCallback = self.getCallback(self, callback, () => { OriginFunctionHelper.executeOriginFunction(owner, functionName, [callback] as any); });

                const result = OriginFunctionHelper.executeOriginFunction(owner, functionName, [onCallback] as any);
                return result;
            };

        }

        private spySetTimer(functionName: string): void {
            // Needs both this.
            // tslint:disable-next-line
            const self = this;

            const oldSetTimer = this.spiedWindow[functionName];
            const needsReplay = (functionName === "setTimeout");
            const spiedWindow = this.spiedWindow;

            // tslint:disable-next-line:only-arrow-functions
            spiedWindow[functionName] = function () {
                let callback = arguments[0];
                const time = arguments[1];
                if (TimeSpy.setTimerCommonValues.indexOf(time) > -1) {
                    callback = self.getCallback(self, callback, needsReplay ?
                        () => { spiedWindow[functionName](callback); } : null);
                }

                return oldSetTimer.apply(self.spiedWindow, [callback, time]);
            };
        }

        private getCallback(self: TimeSpy, callback: any, skippedCalback: () => void = null): Function {
            return function () {
                const now = self.time.now;

                self.lastFrame = ++self.lastFrame % self.speedRatio;
                if (self.willPlayNextFrame || (self.speedRatio && !self.lastFrame)) {
                    self.onFrameStart.trigger(self);
                    try {
                        callback.apply(self.spiedWindow, arguments);
                    }
                    catch (e) {
                        self.onError.trigger(e);
                    }
                    self.lastSixtyFramesCurrentIndex = (self.lastSixtyFramesCurrentIndex + 1) % TimeSpy.fpsWindowSize;
                    self.lastSixtyFramesDuration[self.lastSixtyFramesCurrentIndex] =
                        now - self.lastSixtyFramesPreviousStart;
                    self.onFrameEnd.trigger(self);
                    self.willPlayNextFrame = false;
                }
                else {
                    if (skippedCalback) {
                        skippedCalback();
                    }
                }

                self.lastSixtyFramesPreviousStart = now;
            };
        }
    }
}
