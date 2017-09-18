namespace SPECTOR {

    export interface ICommandSpy {
        readonly spiedCommandName: string;
        createCapture(functionInformation: IFunctionInformation, commandCaptureId: number, marker: string): ICommandCapture;
        spy(): void;
        unSpy(): void;
    }

    export type CommandSpyCallback = (command: ICommandSpy, functionInformation: IFunctionInformation) => void;

    export interface ICommandSpyOptions extends IStateOptions {
        readonly spiedCommandName: string;
        readonly spiedCommandRunningContext: any;
        readonly callback: CommandSpyCallback;

        readonly commandNamespace: FunctionIndexer;
        readonly stackTraceCtor: StackTraceConstructor;
        readonly defaultCommandCtor: CommandConstructor;
    }

    export type CommandSpyConstructor = {
        new(options: ICommandSpyOptions, time: ITime, logger: ILogger): ICommandSpy;
    };
}

namespace SPECTOR.Spies {
    export class CommandSpy implements ICommandSpy {
        private static customCommandsConstructors: { [commandName: string]: CommandConstructor; };

        public readonly spiedCommandName: string;

        private readonly stackTrace: IStackTrace;
        private readonly spiedCommand: any;
        private readonly spiedCommandRunningContext: any;
        private readonly callback: CommandSpyCallback;
        private readonly commandOptions: ICommandOptions;

        private command: ICommand;
        private overloadedCommand: any;

        constructor(options: ICommandSpyOptions, private readonly time: ITime, private readonly logger: ILogger) {
            this.stackTrace = new options.stackTraceCtor();

            this.spiedCommandName = options.spiedCommandName;
            this.spiedCommandRunningContext = options.spiedCommandRunningContext;
            this.spiedCommand = this.spiedCommandRunningContext[this.spiedCommandName];
            OriginFunctionHelper.storeOriginFunction(this.spiedCommandRunningContext, this.spiedCommandName);
            this.callback = options.callback;

            this.commandOptions = {
                context: options.context,
                contextVersion: options.contextVersion,
                extensions: options.extensions,
                toggleCapture: options.toggleCapture,
                spiedCommandName: options.spiedCommandName,
            };

            this.initCustomCommands(options.commandNamespace);
            this.initCommand(options.defaultCommandCtor);
        }

        public spy(): void {
            this.spiedCommandRunningContext[this.spiedCommandName] = this.overloadedCommand;
        }

        public unSpy(): void {
            this.spiedCommandRunningContext[this.spiedCommandName] = this.spiedCommand;
        }

        public createCapture(functionInformation: IFunctionInformation, commandCaptureId: number, marker: string): ICommandCapture {
            return this.command.createCapture(functionInformation, commandCaptureId, marker);
        }

        private initCustomCommands(commandNamespace: FunctionIndexer): void {
            if (CommandSpy.customCommandsConstructors) {
                return;
            }

            CommandSpy.customCommandsConstructors = {};
            for (const spy in commandNamespace) {
                if (commandNamespace.hasOwnProperty(spy)) {
                    const commandCtor = commandNamespace[spy];
                    const commandName = Decorators.getCommandName(commandCtor);
                    if (commandName) {
                        CommandSpy.customCommandsConstructors[commandName] = commandCtor;
                    }
                }
            }
        }

        private initCommand(defaultCommandCtor: CommandConstructor): void {
            if (CommandSpy.customCommandsConstructors[this.spiedCommandName]) {
                this.command = new CommandSpy.customCommandsConstructors[this.spiedCommandName](this.commandOptions,
                    this.stackTrace, this.logger);
            }
            else {
                this.command = new defaultCommandCtor(this.commandOptions, this.stackTrace, this.logger);
            }

            this.overloadedCommand = this.getSpy();
        }

        private getSpy(): any {
            // Needs both this.
            // tslint:disable-next-line
            const self = this;

            // Needs arguments access.
            // tslint:disable-next-line:only-arrow-functions
            return function () {
                const before = self.time.now;
                const result = OriginFunctionHelper.executeOriginFunction(self.spiedCommandRunningContext, self.spiedCommandName, arguments);
                const after = self.time.now;

                const functionInformation = {
                    name: self.spiedCommandName,
                    args: arguments,
                    result,
                    startTime: before,
                    endTime: after,
                };

                self.callback(self, functionInformation);

                return result;
            };
        }
    }
}
