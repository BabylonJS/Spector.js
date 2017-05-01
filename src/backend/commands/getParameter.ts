namespace SPECTOR.Commands {

    @Decorators.command("getParameter")
    export class GetParameter extends BaseCommand {
        protected stringifyResult(result: any): string {
            if (!result) {
                return "null";
            }

            const tag = WebGlObjects.getWebGlObjectTag(result);
            if (tag) {
                return tag.displayText;
            }

            return result;
        }
    }
}
