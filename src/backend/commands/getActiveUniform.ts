namespace SPECTOR.Commands {

    @Decorators.command("getActiveUniform")
    export class GetActiveUniform extends BaseCommand {
        protected stringifyResult(result: any): string {
            if (!result) {
                return undefined;
            }

            return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
        }
    }
}
