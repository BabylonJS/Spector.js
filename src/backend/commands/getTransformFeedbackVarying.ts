namespace SPECTOR.Commands {

    @Decorators.command("getTransformFeedbackVarying")
    export class GetTransformFeedbackVarying extends BaseCommand {
        protected stringifyResult(result: any): string {
            if (!result) {
                return undefined;
            }

            return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
        }
    }
}