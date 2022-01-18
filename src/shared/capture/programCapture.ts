export interface IShaderCapture {
    COMPILE_STATUS: boolean;
    shaderType: string;
    name: string;
    source: string;
    translatedSource: string;
}

export interface IProgramStatus {
    LINK_STATUS: boolean;
    VALIDATE_STATUS: boolean;
}

export interface IProgramCapture {
    programStatus: IProgramStatus;
    shaders: IShaderCapture[];
    length: number;
}
