namespace SPECTOR.Commands {

    @Decorators.command("scissor")
    export class Scissor extends BaseCommand {
        protected stringifyArgs(args: IArguments): string[] {
            const stringified = [];
            for (let i = 0; i < 4; i++) {
                stringified.push(args[i].toFixed(0));
            }
            return stringified;
        }
    }
}
