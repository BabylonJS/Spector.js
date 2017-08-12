namespace SPECTOR.Commands {

    @Decorators.command("disableVertexAttribArray")
    export class DisableVertexAttribArray extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(args[0]);
            return stringified;
        }
    }
}
