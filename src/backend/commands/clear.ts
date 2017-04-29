namespace SPECTOR.Commands {

    @Decorators.command("clear")
    export class Clear extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            if ((args[0] & WebGlConstants.DEPTH_BUFFER_BIT.value) === WebGlConstants.DEPTH_BUFFER_BIT.value) {
                stringified.push(WebGlConstants.DEPTH_BUFFER_BIT.name);
            }
            if ((args[0] & WebGlConstants.STENCIL_BUFFER_BIT.value) === WebGlConstants.STENCIL_BUFFER_BIT.value) {
                stringified.push(WebGlConstants.STENCIL_BUFFER_BIT.name);
            }
            if ((args[0] & WebGlConstants.COLOR_BUFFER_BIT.value) === WebGlConstants.COLOR_BUFFER_BIT.value) {
                stringified.push(WebGlConstants.COLOR_BUFFER_BIT.name);
            }

            return stringified;
        }
    }
}