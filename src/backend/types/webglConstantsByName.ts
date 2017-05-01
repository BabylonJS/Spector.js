namespace SPECTOR {
    // tslint:disable-next-line:interface-name
    export interface WebGlConstantsByName {
        [name: string]: WebGlConstant;
    }

    export const WebGlConstantsByName: WebGlConstantsByName = {};

    (function init() {
        for (const name in WebGlConstants) {
            if (WebGlConstants.hasOwnProperty(name)) {
                const constant = (WebGlConstants as any)[name];
                WebGlConstantsByName[constant.name] = constant;
            }
        }
    })();
}
