namespace SPECTOR.Commands {

    @Decorators.command("vertexAttribPointer")
    export class VertexAttribPointer extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];

            stringified.push(args[0]);
            stringified.push(args[1]);

            stringified.push(WebGlConstants.stringifyWebGlConstant(args[2], "vertexAttribPointer"));

            stringified.push(args[3]);
            stringified.push(args[4]);
            stringified.push(args[5]);

            return stringified;
        }
    }
}
