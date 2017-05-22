namespace SPECTOR.Commands {

    @Decorators.command("drawBuffers")
    export class DrawBuffers extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            for (let i = 0; i < args.length; i++) {
                stringified.push(WebGlConstants.stringifyWebGlConstant(args[i], "drawBuffers"));
            }

            return stringified;
        }
    }
}
