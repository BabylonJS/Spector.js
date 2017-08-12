namespace SPECTOR {

    export interface ICommand {
        readonly spiedCommandName: string;

        createCapture(functionInformation: IFunctionInformation, commandCaptureId: number, marker: string): ICommandCapture;
    }

    export interface ICommandOptions extends IContextInformation {
        readonly spiedCommandName: string;
    }

    export type CommandConstructor = {
        new(options: ICommandOptions, stackTrace: IStackTrace, logger: ILogger): ICommand;
    };
}

namespace SPECTOR.Commands {
    export abstract class BaseCommand implements ICommand {

        public readonly spiedCommandName: string;

        constructor(protected readonly options: ICommandOptions,
            protected readonly stackTrace: IStackTrace,
            protected readonly logger: ILogger) {
            this.spiedCommandName = options.spiedCommandName;
        }

        public createCapture(functionInformation: IFunctionInformation, commandCaptureId: number, marker: string): ICommandCapture {
            // Removes the spector internal calls to leave only th relevant part.
            const stackTrace = this.stackTrace.getStackTrace(4, 1);

            // Includes uniform functions special cases to prevent lots of inheritence.
            const text = (functionInformation.name.indexOf("uniform") === 0) ?
                this.stringifyUniform(functionInformation.arguments) :
                this.stringify(functionInformation.arguments, functionInformation.result);

            const commandCapture = {
                id: commandCaptureId,
                startTime: functionInformation.startTime,
                commandEndTime: functionInformation.endTime,
                endTime: 0, // Compute at the end

                name: functionInformation.name,
                commandArguments: functionInformation.arguments,
                result: functionInformation.result,

                stackTrace,
                status: CommandCaptureStatus.Unknown,
                marker,
                text,
            };

            this.transformCapture(commandCapture);

            for (let i = 0; i < commandCapture.commandArguments.length; i++) {
                const argument = commandCapture.commandArguments[i];
                if (argument && argument.length && argument.length > 50) {
                    commandCapture.commandArguments[i] = "Array Legnth: " + argument.length;
                }
            }

            if (commandCapture.commandArguments) {
                const argumentsArray: any[] = [];
                for (let i = 0; i < commandCapture.commandArguments.length; i++) {
                    const commandArgument = commandCapture.commandArguments[i];
                    if (commandArgument === undefined) {
                        argumentsArray.push(undefined);
                    }
                    else if (commandArgument === null) {
                        argumentsArray.push(null);
                    }
                    else {
                        argumentsArray.push(JSON.parse(JSON.stringify(commandArgument)));
                    }
                }
                commandCapture.commandArguments = argumentsArray as any;
            }
            if (commandCapture.result) {
                commandCapture.result = JSON.parse(JSON.stringify(commandCapture.result));
            }

            return commandCapture;
        }

        protected transformCapture(commandCapture: ICommandCapture): void {
            // Nothing by default.
        }

        protected stringify(args: IArguments, result: any): string {
            let stringified = this.options.spiedCommandName;
            if (args && args.length > 0) {
                stringified += ": " + this.stringifyArgs(args).join(", ");
            }
            if (result) {
                stringified += " -> " + this.stringifyResult(result);
            }
            return stringified;
        }

        protected stringifyUniform(args: IArguments): string {
            let stringified = this.options.spiedCommandName;
            if (args && args.length > 0) {
                const stringifiedArgs = [];
                stringifiedArgs.push(this.stringifyValue(args[0]));
                for (let i = 1; i < args.length; i++) {
                    const arg = args[i] + "";
                    stringifiedArgs.push(arg);
                }
                stringified += ": " + stringifiedArgs.join(", ");
            }
            return stringified;
        }

        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                const stringifiedValue = this.stringifyValue(arg);
                stringified.push(stringifiedValue);
            }
            return stringified;
        }

        protected stringifyResult(result: any): string {
            if (!result) {
                return undefined;
            }

            return this.stringifyValue(result);
        }

        protected stringifyValue(value: any): string {
            if (value === null) {
                return "null";
            }

            if (value === undefined) {
                return "undefined";
            }

            const tag = WebGlObjects.getWebGlObjectTag(value);
            if (tag) {
                return tag.displayText;
            }

            if (typeof value === "number" && WebGlConstants.isWebGlConstant(value)) {
                return WebGlConstants.stringifyWebGlConstant(value, this.spiedCommandName);
            }

            if (typeof value === "string") {
                return value;
            }

            if (value instanceof HTMLImageElement) {
                return value.src;
            }

            if (value instanceof ArrayBuffer) {
                return "[--(" + value.byteLength + ")--]";
            }

            if (value.length) {
                return "[..(" + value.length + ")..]";
            }

            return value;
        }
    }
}
