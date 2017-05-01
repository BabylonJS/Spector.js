namespace SPECTOR.Commands {

    @Decorators.command("getShaderPrecisionFormat")
    export class GetShaderPrecisionFormat extends BaseCommand {
        protected stringifyResult(result: any): string {
            if (!result) {
                return undefined;
            }

            return `min: ${result.rangeMin}, max: ${result.rangeMax}, precision: ${result.precision}`;
        }
    }
}
