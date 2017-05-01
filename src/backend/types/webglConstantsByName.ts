namespace SPECTOR {
    export interface WebGlConstantsByName {
        [name: string]: WebGlConstant
    }

    export const WebGlConstantsByName: WebGlConstantsByName = {};

    (function init() {
        for (const name in WebGlConstants) {
            const constant = (<any>WebGlConstants)[name];
            WebGlConstantsByName[constant.name] = constant;
        }
    })();
}
