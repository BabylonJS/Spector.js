module SPECTOR {
    export type StateData = { [key: string]: any };

    export interface IState {
        readonly stateName: string;
        registerCallbacks(callbacks: CommandCapturedCallbacks): void;
        startCapture(): State;
        stopCapture(): State;
        getStateData(): StateData;
        readonly requireStartAndStopStates: boolean;
    }

    export interface IStateOptions extends IContextInformation {
        readonly stateName?: string;
    }

    export type StateConstructor = {
        new (options: IStateOptions, logger: ILogger): IState;
    }
}

namespace SPECTOR.States {
    export const drawCommands = [
        "drawArrays",
        "drawElements",
        "drawArraysInstanced",
        "drawBuffers",
        "drawElementsInstanced",
        "drawElementsInstancedANGLE",
        "drawRangeElements"
    ];

    export abstract class BaseState implements IState {
        private readonly changeCommandsByState: { [key: string]: string[] };
        private readonly consumeCommands: string[];
        private readonly commandNameToStates: { [commandName: string]: string[] };
        private readonly requireInitAndEndState: boolean;

        protected readonly context: WebGLRenderingContexts;
        protected readonly contextVersion: number;
        protected readonly extensions: ExtensionList;
        protected readonly toggleCapture: (capture: boolean) => void;

        private capturedCommandsByState: { [key: string]: ICommandCapture[] };

        protected previousState: State;
        protected currentState: State;

        public readonly stateName: string;

        public get requireStartAndStopStates(): boolean {
            return true;
        }

        protected abstract readFromContext(): void;

        constructor(protected readonly options: IStateOptions, protected readonly logger: ILogger) {
            this.context = options.context;
            this.contextVersion = options.contextVersion;
            this.extensions = options.extensions;
            this.toggleCapture = options.toggleCapture;
            this.stateName = options.stateName;

            this.consumeCommands = this.getConsumeCommands();
            this.changeCommandsByState = this.getChangeCommandsByState();
            this.commandNameToStates = this.getCommandNameToStates();
        }

        public startCapture(loadFromContext = true): State {
            this.capturedCommandsByState = {};
            if (loadFromContext && this.requireStartAndStopStates) {
                this.currentState = {};
                this.readFromContextNoSideEffects();
            }
            this.copyCurrentStateToPrevious();
            this.currentState = {};

            return this.previousState;
        }

        public stopCapture(): State {
            if (this.requireStartAndStopStates) {
                this.readFromContextNoSideEffects();
            }
            this.analyse(undefined);

            return this.currentState;
        }

        public registerCallbacks(callbacks: CommandCapturedCallbacks): void {
            for (const stateName in this.changeCommandsByState) {
                for (const changeCommand of this.changeCommandsByState[stateName]) {
                    callbacks[changeCommand] = callbacks[changeCommand] || [];
                    callbacks[changeCommand].push(this.onChangeCommand.bind(this));
                }
            }

            for (const commandName of this.consumeCommands) {
                callbacks[commandName] = callbacks[commandName] || [];
                callbacks[commandName].push(this.onConsumeCommand.bind(this));
            }
        }

        public getStateData(): StateData {
            return this.currentState;
        }

        protected getConsumeCommands(): string[] {
            return [];
        }

        protected getChangeCommandsByState(): { [key: string]: string[] } {
            return {};
        }

        protected copyCurrentStateToPrevious(): void {
            if (!this.currentState) {
                return;
            }

            this.previousState = this.currentState;
        }

        protected onChangeCommand(command: ICommandCapture): void {
            const stateNames = this.commandNameToStates[command.name];
            for (const stateName of stateNames) {
                if (!this.isValidChangeCommand(command, stateName)) {
                    return;
                }

                this.capturedCommandsByState[stateName] = this.capturedCommandsByState[stateName] || [];
                this.capturedCommandsByState[stateName].push(command);
            }
        }

        protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
            return true;
        }

        protected onConsumeCommand(command: ICommandCapture): void {
            if (!this.isValidConsumeCommand(command)) {
                return;
            }

            this.readFromContextNoSideEffects();
            this.analyse(command);
            this.storeCommandIds();
            command[this.stateName] = this.currentState;

            this.startCapture(false);
        }

        protected isValidConsumeCommand(command: ICommandCapture): boolean {
            return true;
        }

        protected analyse(consumeCommand: ICommandCapture): void {
            for (const stateName in this.capturedCommandsByState) {
                const commands = this.capturedCommandsByState[stateName];
                const lengthM1 = commands.length - 1;
                if (lengthM1 >= 0) {
                    if (consumeCommand) {
                        for (let i = 0; i < lengthM1; i++) {
                            const command = commands[i];
                            command.consumeCommandId = consumeCommand.id;
                            this.changeCommandCaptureStatus(command, CommandCaptureStatus.Redundant);
                        }

                        const isStateEnabled = this.isStateEnableNoSideEffects(stateName, consumeCommand.commandArguments);
                        const command = commands[lengthM1];
                        command.consumeCommandId = consumeCommand.id;

                        if (!this.areStatesEquals(this.currentState[stateName], this.previousState[stateName])) {
                            if (isStateEnabled) {
                                this.changeCommandCaptureStatus(command, CommandCaptureStatus.Valid);
                            }
                            else {
                                this.changeCommandCaptureStatus(command, CommandCaptureStatus.Disabled);
                            }
                        }
                        else {
                            this.changeCommandCaptureStatus(command, CommandCaptureStatus.Redundant);
                        }
                    }
                    else {
                        for (let i = 0; i < commands.length; i++) {
                            const command = commands[i];
                            this.changeCommandCaptureStatus(command, CommandCaptureStatus.Unused);
                        }
                    }
                }
            }
        }

        protected storeCommandIds(): void {
            const commandIdsStates = ["unusedCommandIds", "disabledCommandIds", "redundantCommandIds", "validCommandIds"];
            for (const commandIdsStatus of commandIdsStates) {
                this.currentState[commandIdsStatus] = <any>[];
            }

            for (const stateName in this.capturedCommandsByState) {
                const commands = this.capturedCommandsByState[stateName];
                for (const command of commands) {
                    switch (command.status) {
                        case CommandCaptureStatus.Unused:
                            this.currentState["unusedCommandIds"].push(command.id);
                            break;
                        case CommandCaptureStatus.Disabled:
                            this.currentState["disabledCommandIds"].push(command.id);
                            break;
                        case CommandCaptureStatus.Redundant:
                            this.currentState["redundantCommandIds"].push(command.id);
                            break;
                        case CommandCaptureStatus.Valid:
                            this.currentState["validCommandIds"].push(command.id);
                            break;
                    }
                }
            }

            for (const commandIdsStatus of commandIdsStates) {
                if (!this.currentState[commandIdsStatus].length) {
                    delete this.currentState[commandIdsStatus];
                }
            }
        }

        protected changeCommandCaptureStatus(capture: ICommandCapture, status: CommandCaptureStatus): boolean {
            if (capture.status < status) {
                capture.status = status;
                return true;
            }

            return false;
        }

        protected areStatesEquals(a: any, b: any): boolean {
            if (typeof a !== typeof b) {
                return false;
            }

            if (a && !b) {
                return false;
            }

            if (b && !a) {
                return false;
            }

            if (a === undefined || a === null) {
                return true;
            }

            if (a.length && b.length && typeof a !== "string") {
                if (a.length !== b.length) {
                    return false;
                }

                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) {
                        return false;
                    }
                }

                return true;
            }

            return a === b;
        }

        protected isStateEnable(stateName: string, args: IArguments): boolean {
            return true;
        }

        private readFromContextNoSideEffects(): void {
            this.toggleCapture(false);
            this.readFromContext();
            this.toggleCapture(true);
        }

        private isStateEnableNoSideEffects(stateName: string, args: IArguments): boolean {
            this.toggleCapture(false);
            const enable = this.isStateEnable(stateName, args);
            this.toggleCapture(true);
            return enable;
        }

        private getCommandNameToStates(): { [key: string]: string[] } {
            let result: { [key: string]: string[] } = {};
            for (const stateName in this.changeCommandsByState) {
                for (const changeCommand of this.changeCommandsByState[stateName]) {
                    result[changeCommand] = result[changeCommand] || [];
                    result[changeCommand].push(stateName);
                }
            }
            return result;
        }
    }
}
