namespace SPECTOR.States {

    @Decorators.state("MipmapHintState")
    export class MipmapHintState extends ParameterState {

        protected getWebgl1Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.GENERATE_MIPMAP_HINT, changeCommands: ["hint"] }];
        }
        
        protected getConsumeCommands(): string[] {
            return [ "generateMipmap" ];
        }
    }
}