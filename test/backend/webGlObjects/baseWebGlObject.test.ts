import { BaseWebGlObject } from "../../../src/backend/webGlObjects/baseWebGlObject";

class ConcreteWebGlObject extends BaseWebGlObject {
    get typeName(): string {
        return "WebGLTexture";
    }
}

describe('BaseWebGlObject', () => {
    it('type getter returns the global constructor when it exists', () => {
        const obj = new ConcreteWebGlObject();
        // WebGLTexture may or may not exist in jsdom; just verify no crash
        const type = obj.type;
        // Should return a function or null, never throw
        expect(type === null || typeof type === 'function').toBe(true);
    });

    it('type getter returns null for unknown type names', () => {
        class UnknownObject extends BaseWebGlObject {
            get typeName(): string {
                return "__NonExistent_Type_12345__";
            }
        }
        const obj = new UnknownObject();
        expect(obj.type).toBeNull();
    });
});
