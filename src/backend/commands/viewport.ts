namespace SPECTOR.Commands {

    @Decorators.command("viewport")
    export class Viewport extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            for (let i = 0; i < 4; i++) {
                stringified.push(args[i].toFixed(2));
            }
            return stringified;
        }
    }
}
