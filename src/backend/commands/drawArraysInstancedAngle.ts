namespace SPECTOR.Commands {

    @Decorators.command("drawArraysInstancedANGLE")
    export class DrawArraysInstancedAngle extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstancedANGLE"));
            stringified.push(args[1]);
            stringified.push(args[2]);
            stringified.push(args[3]);

            return stringified;
        }
    }
}
