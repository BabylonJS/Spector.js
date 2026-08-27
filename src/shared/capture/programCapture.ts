export interface IShaderCapture {
    COMPILE_STATUS: boolean | null;
    shaderType: string;
    name: string;
    source: string;
    translatedSource: string;
    infoLog: string;
}

export interface IProgramStatus {
    LINK_STATUS: boolean;
    VALIDATE_STATUS: boolean;
    infoLog: string;
}

export interface IProgramCapture {
    programStatus: IProgramStatus;
    shaders: IShaderCapture[];
    length: number;
}
