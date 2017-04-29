namespace SPECTOR {
    export type WebGlObjectTag = {
        readonly typeName: string;
        readonly id: number;
        version: number;
        displayText?: string;
    }

    export interface IWebGlObject {
        readonly typeName: string;        
        readonly type: Function;

        tagWebGlObject(webGlObject: WebGLObject): WebGlObjectTag;
    }

    export interface IWebGlObjectOptions extends IContextInformation {
        readonly typeName: string;        
        readonly type: Function;
    }

    export type WebGlObjectConstructor = {
        new (options: IWebGlObjectOptions, logger: ILogger): IWebGlObject;
    }
}

namespace SPECTOR.WebGlObjects {
    const SPECTOROBJECTTAGKEY = "__SPECTOR_Object_TAG";

    export function getWebGlObjectTag(object: WebGLObject): WebGlObjectTag {
        return (<any>object)[SPECTOROBJECTTAGKEY];
    }

    export function attachWebGlObjectTag(object: WebGLObject, tag: WebGlObjectTag): void {
        tag.displayText = stringifyWebGlObjectTag(tag);
        (<any>object)[SPECTOROBJECTTAGKEY] = tag;
    }

    export function stringifyWebGlObjectTag(tag: WebGlObjectTag): string {
        if (!tag) {
            return 'No tag available.';    
        }
        return `${tag.typeName} - ID: ${tag.id} - Version: ${tag.version}`;
    }
}

namespace SPECTOR.WebGlObjects {   
    export abstract class BaseWebGlObject implements IWebGlObject {

        private id: number;

        public readonly typeName: string;
        public readonly type: Function;
        
        constructor(protected options: IWebGlObjectOptions, logger: ILogger) {    
           this.typeName = options.typeName;
           this.type = options.type;
           this.id = 0;
        }

        public tagWebGlObject(webGlObject: any): WebGlObjectTag {
            if (!this.type) {
                return undefined;
            }
            
            let tag: WebGlObjectTag;
            if (!webGlObject) {
                return tag;
            }
            
            tag = getWebGlObjectTag(webGlObject);
            if (tag) {
                return tag;
            }

            if (webGlObject instanceof this.type) {
                const id = this.getNextId();
                tag = {
                    typeName: this.typeName,
                    id: id,
                    version: 0
                };
                attachWebGlObjectTag(webGlObject, tag);
                return tag;
            }

            return tag;
        }

        protected getNextId(): number {
            return this.id++;
        }
    }
}