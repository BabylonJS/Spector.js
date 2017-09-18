// tslint:disable:ban-types
// tslint:disable:only-arrow-functions

namespace SPECTOR {

    export interface IWebGlObjectSpy {
        readonly contextInformation: IContextInformation;

        tagWebGlObjects(functionInformation: IFunctionInformation): void;
        tagWebGlObject(object: any): WebGlObjectTag;
    }

    export interface IWebGlObjectSpyOptions {
        readonly contextInformation: IContextInformation;
        readonly webGlObjectNamespace: FunctionIndexer;
    }

    export type WebGlObjectSpyConstructor = {
        new(options: IWebGlObjectSpyOptions, logger: ILogger): IWebGlObjectSpy,
    };
}

namespace SPECTOR.Spies {
    export class WebGlObjectSpy implements IWebGlObjectSpy {

        public readonly contextInformation: IContextInformation;

        private readonly webGlObjectConstructors:
        { [typeName: string]: { ctor: WebGlObjectConstructor, type: Function } };
        private readonly webGlObjects: { [typeName: string]: IWebGlObject };

        constructor(private readonly options: IWebGlObjectSpyOptions, private readonly logger: ILogger) {
            this.webGlObjectConstructors = {};
            this.webGlObjects = {};
            this.contextInformation = options.contextInformation;

            this.initAvailableWebglObjects();
            this.initWebglObjects();
        }

        public tagWebGlObjects(functionInformation: IFunctionInformation) {
            for (const typeName in this.webGlObjects) {
                if (this.webGlObjects.hasOwnProperty(typeName)) {
                    const webGlObject = this.webGlObjects[typeName];
                    for (let i = 0; i < functionInformation.args.length; i++) {
                        const arg = functionInformation.args[i];
                        if (webGlObject.tagWebGlObject(arg)) {
                            break;
                        }
                    }
                    if (webGlObject.tagWebGlObject(functionInformation.result)) {
                        break;
                    }
                }
            }
        }

        public tagWebGlObject(object: any): WebGlObjectTag {
            for (const typeName in this.webGlObjects) {
                if (this.webGlObjects.hasOwnProperty(typeName)) {
                    const webGlObject = this.webGlObjects[typeName];
                    const tag = webGlObject.tagWebGlObject(object);
                    if (tag) {
                        return tag;
                    }
                }
            }
            return undefined;
        }

        private initAvailableWebglObjects(): void {
            for (const webGlObject in this.options.webGlObjectNamespace) {
                if (this.options.webGlObjectNamespace.hasOwnProperty(webGlObject)) {
                    const webGlObjectCtor = this.options.webGlObjectNamespace[webGlObject];
                    const typeName = Decorators.getWebGlObjectName(webGlObjectCtor);
                    const type = Decorators.getWebGlObjectType(webGlObjectCtor);
                    if (typeName && type) {
                        this.webGlObjectConstructors[typeName] = {
                            ctor: webGlObjectCtor,
                            type,
                        };
                    }
                }
            }
        }

        private initWebglObjects(): void {
            for (const typeName in this.webGlObjectConstructors) {
                if (this.webGlObjectConstructors.hasOwnProperty(typeName)) {
                    const options = merge({
                        typeName,
                        type: this.webGlObjectConstructors[typeName].type,
                    },
                        this.contextInformation,
                    );

                    const webglObject = new this.webGlObjectConstructors[typeName].ctor(options, this.logger);
                    this.webGlObjects[typeName] = webglObject;
                }
            }
        }
    }
}
