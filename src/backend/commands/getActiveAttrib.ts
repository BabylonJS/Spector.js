namespace SPECTOR.Commands {

    @Decorators.command("getActiveAttrib")
    export class GetActiveAttrib extends BaseCommand {
        protected stringifyResult(result: any): string {
            if (!result) {
                return undefined;
            }

            return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
        }
    }
}