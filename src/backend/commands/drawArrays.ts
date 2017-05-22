namespace SPECTOR.Commands {

    @Decorators.command("drawArrays")
    export class DrawArrays extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArrays"));
            stringified.push(args[1]);
            stringified.push(args[2]);

            return stringified;
        }
    }
}
