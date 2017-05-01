namespace SPECTOR {

    export interface IStateSpy {
        readonly contextInformation: IContextInformation;

        startCapture(currentCapture: ICapture): void;
        stopCapture(currentCapture: ICapture): void;
        captureState(commandCapture: ICommandCapture): void;
    }

    export interface IStateSpyOptions {
        readonly contextInformation: IContextInformation;
        readonly stateNamespace: FunctionIndexer;
    }

    export type StateSpyConstructor = {
        new (options: IStateSpyOptions, logger: ILogger): IStateSpy,
    };
}

namespace SPECTOR.Spies {
    export class StateSpy implements IStateSpy {

        public readonly contextInformation: IContextInformation;

        private readonly stateConstructors: { [stateName: string]: StateConstructor; };
        private readonly stateTrackers: { [name: string]: IState };
        private readonly onCommandCapturedCallbacks: CommandCapturedCallbacks;

        constructor(private readonly options: IStateSpyOptions, private readonly logger: ILogger) {
            this.stateTrackers = {};
            this.onCommandCapturedCallbacks = {};
            this.stateConstructors = {};
            this.contextInformation = options.contextInformation;

            this.initAvailableStateTrackers();
            this.initStateTrackers();
        }

        public startCapture(currentCapture: ICapture): void {
            for (const stateTrackerName in this.stateTrackers) {
                if (this.stateTrackers.hasOwnProperty(stateTrackerName)) {
                    const stateTracker = this.stateTrackers[stateTrackerName];
                    const state = stateTracker.startCapture();
                    if (stateTracker.requireStartAndStopStates) {
                        currentCapture.initState[stateTrackerName] = state;
                    }
                }
            }
        }

        public stopCapture(currentCapture: ICapture): void {
            for (const stateTrackerName in this.stateTrackers) {
                if (this.stateTrackers.hasOwnProperty(stateTrackerName)) {
                    const stateTracker = this.stateTrackers[stateTrackerName];
                    const state = stateTracker.stopCapture();
                    if (stateTracker.requireStartAndStopStates) {
                        currentCapture.endState[stateTrackerName] = state;
                    }
                }
            }
        }

        public captureState(commandCapture: ICommandCapture): void {
            const callbacks = this.onCommandCapturedCallbacks[commandCapture.name];
            if (callbacks) {
                for (const callback of callbacks) {
                    callback(commandCapture);
                }
            }
        }

        private initAvailableStateTrackers(): void {
            for (const state in this.options.stateNamespace) {
                if (this.options.stateNamespace.hasOwnProperty(state)) {
                    const stateCtor = this.options.stateNamespace[state];
                    const stateName = Decorators.getStateName(stateCtor);
                    if (stateName) {
                        this.stateConstructors[stateName] = stateCtor;
                    }
                }
            }
        }

        private initStateTrackers(): void {
            for (const stateName in this.stateConstructors) {
                if (this.stateConstructors.hasOwnProperty(stateName)) {
                    const options = merge(
                        { stateName },
                        this.contextInformation,
                    );

                    const stateTracker = new this.stateConstructors[stateName](options, this.logger);
                    this.stateTrackers[stateName] = stateTracker;

                    stateTracker.registerCallbacks(this.onCommandCapturedCallbacks);
                }
            }
        }
    }
}
