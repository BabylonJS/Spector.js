namespace SPECTOR.Commands {

    @Decorators.command("getExtension")
    export class GetExtension extends BaseCommand {
        protected stringifyResult(result: any): string {
            return result ? "true" : "false";
        }
    }
}
