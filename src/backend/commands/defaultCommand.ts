namespace SPECTOR.Commands {
    const deprecatedCommands = [
        "lineWidth",
    ];

    export class DefaultCommand extends BaseCommand {
        private readonly isDeprecated: boolean;

        constructor(options: ICommandOptions, stackTrace: IStackTrace, logger: ILogger) {
            super(options, stackTrace, logger);

            this.isDeprecated = (deprecatedCommands.indexOf(this.spiedCommandName) > -1);
        }

        public transformCapture(commandCapture: ICommandCapture): void {
            if (this.isDeprecated) {
                commandCapture.status = CommandCaptureStatus.Deprecated;
            }
        }
    }
}
