namespace SPECTOR.Commands {

    @Decorators.command("enableVertexAttribArray")
    export class EnableVertexAttribArray extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            stringified.push(args[0]);
            return stringified;
        }
    }
}
