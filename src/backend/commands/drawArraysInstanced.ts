namespace SPECTOR.Commands {

    @Decorators.command("drawArraysInstanced")
    export class DrawArraysInstanced extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstanced"));
            stringified.push(args[1]);
            stringified.push(args[2]);
            stringified.push(args[3]);

            return stringified;
        }
    }
}
