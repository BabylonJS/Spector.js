namespace SPECTOR {
    export interface WebGlConstantsByValue {
        [value: number]: WebGlConstant
    }

    export const WebGlConstantsByValue: WebGlConstantsByValue = {};

    (function init(){
        for (const name in WebGlConstants) {            
            const constant = (<any>WebGlConstants)[name];
            WebGlConstantsByValue[constant.value] = constant;
        }
    })();
}