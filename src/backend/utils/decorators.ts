namespace SPECTOR.Decorators {
    // tslint:disable:only-arrow-functions

    const COMMANDNAMEKEY = "__CommandName";
    export function command(commandName: string) {
        return function (target: any) {
            target[COMMANDNAMEKEY] = commandName;
        };
    }
    export function getCommandName(target: any): string {
        return target[COMMANDNAMEKEY];
    }

    const STATENAMEKEY = "__StateName";
    export function state(stateName: string) {
        return function (target: any) {
            target[STATENAMEKEY] = stateName;
        };
    }
    export function getStateName(target: any): string {
        return target[STATENAMEKEY];
    }

    const RECORDEROBJECTNAMEKEY = "___RecorderObjectName";
    export function recorder(objectName: string) {
        return function (target: any) {
            target[RECORDEROBJECTNAMEKEY] = objectName;
        };
    }
    export function getRecorderName(target: any): string {
        return target[RECORDEROBJECTNAMEKEY];
    }

    export const OBJECTNAMEKEY = "___ObjectName";
    export const OBJECTTYPEKEY = "___ObjectType";
    export function webGlObject(objectName: string) {
        return function (target: any) {
            target[OBJECTNAMEKEY] = objectName;
            target[OBJECTTYPEKEY] = (window as any)[objectName] || null;
        };
    }
    export function getWebGlObjectName(target: any): string {
        return target[OBJECTNAMEKEY];
    }

    // tslint:disable-next-line:ban-types
    export function getWebGlObjectType(target: any): Function {
        return target[OBJECTTYPEKEY];
    }
}
