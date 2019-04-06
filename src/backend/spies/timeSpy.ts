import { Time } from "../../shared/utils/time";
import { OriginFunctionHelper } from "../utils/originFunctionHelper";
import { Observable } from "../../shared/utils/observable";

// tslint:disable:ban-types
// tslint:disable:only-arrow-functions

export class TimeSpy {
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

    public readonly onFrameStart: Observable<TimeSpy>;
    public readonly onFrameEnd: Observable<TimeSpy>;
    public readonly onError: Observable<string>;

    private readonly spiedWindow: { [name: string]: any };
    private readonly lastSixtyFramesDuration: number[];

    private lastSixtyFramesCurrentIndex: number;
    private lastSixtyFramesPreviousStart: number;
    private lastFrame: number;
    private speedRatio: number;
    private willPlayNextFrame: boolean;

    constructor(spiedWindow?: { [name: string]: Function }) {
        this.spiedWindow = spiedWindow || window;
        this.lastFrame = 0;

        this.speedRatio = 1;
        this.willPlayNextFrame = false;
        this.onFrameStart = new Observable<TimeSpy>();
        this.onFrameEnd = new Observable<TimeSpy>();
        this.onError = new Observable<string>();

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
            const onCallback = self.getCallback(self, callback, () => { self.spiedWindow[functionName](callback); });

            const result = OriginFunctionHelper.executeOriginFunction(owner, functionName, [onCallback] as any);
            return result;
        };

    }

    private spySetTimer(functionName: string): void {
        // Needs both this.
        // tslint:disable-next-line
        const self = this;
        const owner = this.spiedWindow;
        const needsReplay = (functionName === "setTimeout");

        OriginFunctionHelper.storeOriginFunction(owner, functionName);

        // tslint:disable-next-line:only-arrow-functions
        owner[functionName] = function () {
            const callback = arguments[0];
            const time = arguments[1];
            const args = Array.prototype.slice.call(arguments);

            if (TimeSpy.setTimerCommonValues.indexOf(time) > -1) {
                args[0] = self.getCallback(self, callback, needsReplay ?
                    () => { owner[functionName](callback); } : null);
            }

            const result = OriginFunctionHelper.executeOriginFunction(owner, functionName, args);
            return result;
        };
    }

    private getCallback(self: TimeSpy, callback: any, skippedCalback: () => void = null): Function {
        return function () {
            const now = Time.now;

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
