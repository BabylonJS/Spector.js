export type WebGlObjectTag = {
    readonly typeName: string;
    readonly id: number;
    displayText?: string;
    customData?: any;
};

export class WebGlObjects {
    public static getWebGlObjectTag(object: WebGLObject): WebGlObjectTag {
        return (object as any)[WebGlObjects.SPECTOROBJECTTAGKEY];
    }

    public static attachWebGlObjectTag(object: WebGLObject, tag: WebGlObjectTag): void {
        tag.displayText = WebGlObjects.stringifyWebGlObjectTag(tag);
        (object as any)[WebGlObjects.SPECTOROBJECTTAGKEY] = tag;
    }

    public static stringifyWebGlObjectTag(tag: WebGlObjectTag): string {
        if (!tag) {
            return "No tag available.";
        }
        return `${tag.typeName} - ID: ${tag.id}`;
    }

    private static readonly SPECTOROBJECTTAGKEY = "__SPECTOR_Object_TAG";
}

// tslint:disable-next-line:max-classes-per-file
export abstract class BaseWebGlObject {

    public abstract get typeName(): string;

    // tslint:disable-next-line:ban-types
    public get type(): Function {
        return (window as any)[this.typeName] || null;
    }

    private id: number;

    constructor() {
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

        tag = WebGlObjects.getWebGlObjectTag(webGlObject);
        if (tag) {
            return tag;
        }

        if (webGlObject instanceof this.type) {
            const id = this.getNextId();
            tag = {
                typeName: this.typeName,
                id,
            };
            WebGlObjects.attachWebGlObjectTag(webGlObject, tag);
            return tag;
        }

        return tag;
    }

    protected getNextId(): number {
        return this.id++;
    }
}
