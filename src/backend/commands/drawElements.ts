namespace SPECTOR.Commands {

    @Decorators.command("drawElements")
    export class DrawElements extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawElements"));
            stringified.push(args[1]);
            stringified.push(WebGlConstants.stringifyWebGlConstant(args[2], "drawElements"));
            stringified.push(args[3]);

            return stringified;
        }
    }
}
