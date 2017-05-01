namespace SPECTOR {
    // tslint:disable-next-line:interface-name
    export interface WebGlConstantsByValue {
        [value: number]: WebGlConstant;
    }

    export const WebGlConstantsByValue: WebGlConstantsByValue = {};

    (function init() {
        for (const name in WebGlConstants) {
            if (WebGlConstants.hasOwnProperty(name)) {
                const constant = (WebGlConstants as any)[name];
                WebGlConstantsByValue[constant.value] = constant;
            }
        }
    })();
}
