export interface IShaderCapture {
    COMPILE_STATUS: boolean;
    fragment: boolean;
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
