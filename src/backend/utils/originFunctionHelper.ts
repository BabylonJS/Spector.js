export class OriginFunctionHelper {
    public static storeOriginFunction(object: any, functionName: string): void {
        if (!object) {
            return;
        }

        if (!object[functionName]) {
            return;
        }

        const originFunctionName = this.getOriginFunctionName(functionName);
        if (object[originFunctionName]) {
            return;
        }

        object[originFunctionName] = object[functionName];
    }

    public static storePrototypeOriginFunction(object: any, functionName: string): void {
        if (!object) {
            return;
        }

        if (!object.prototype[functionName]) {
            return;
        }

        const originFunctionName = this.getOriginFunctionName(functionName);
        if (object.prototype[originFunctionName]) {
            return;
        }

        object.prototype[originFunctionName] = object.prototype[functionName];
    }

    public static executePrototypeOriginFunction(object: any, objectType: any, functionName: string, args: IArguments): any {
        if (!object) {
            return;
        }

        const originFunctionName = this.getOriginFunctionName(functionName);
        if (!objectType.prototype[originFunctionName]) {
            return;
        }

        if (!object[originFunctionName]) {
            object[originFunctionName] = objectType.prototype[originFunctionName];
        }
        return this.executeFunction(object, originFunctionName, args);
    }

    public static executeOriginFunction(object: any, functionName: string, args: IArguments): any {
        if (!object) {
            return;
        }

        const originFunctionName = this.getOriginFunctionName(functionName);
        if (!object[originFunctionName]) {
            return;
        }

        return this.executeFunction(object, originFunctionName, args);
    }

    // tslint:disable
    private static executeFunction(object: any, functionName: string, args: IArguments) {
        const a = args;
        if (a === undefined || a.length === 0) {
            return object[functionName]();
        }

        const length = a.length;
        switch (length) {
            case 1:
                return object[functionName](a[0]);
            case 2:
                return object[functionName](a[0], a[1]);
            case 3:
                return object[functionName](a[0], a[1], a[2]);
            case 4:
                return object[functionName](a[0], a[1], a[2], a[3]);
            case 5:
                return object[functionName](a[0], a[1], a[2], a[3], a[4]);
            case 6:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5]);
            case 7:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
            case 8:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]);
            case 9:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
            case 10:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
            case 11:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);
            case 12:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11]);
            case 13:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12]);
            case 14:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13]);
            case 15:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14]);
            case 16:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
            case 17:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16]);
            case 18:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17]);
            case 19:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17], a[18]);
            case 20:
                return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19]);
            default:
                return object[functionName].apply(object, a);
        }
    }

    private static originFunctionPrefix = "__SPECTOR_Origin_";

    private static getOriginFunctionName(functionName: string): string {
        return this.originFunctionPrefix + functionName;
    }
}
