import { WebGlConstant, WebGlConstants } from "../types/webglConstants";
import { BaseState } from "./baseState";
import { WebGlObjects } from "../webGlObjects/baseWebGlObject";

export const enum ParameterReturnType {
    Unknown = 0,
    GlInt = 10,
    GlEnum = 20,
    GlUint = 30,
}

export interface IParameter {
    readonly constant: WebGlConstant;
    readonly returnType?: ParameterReturnType;
    readonly changeCommands?: string[];
}

export abstract class ParameterState extends BaseState {

    protected parameters: IParameter[][];

    protected getWebgl1Parameters(): IParameter[] {
        return [];
    }

    protected getWebgl2Parameters(): IParameter[] {
        return [];
    }

    protected getChangeCommandsByState(): { [key: string]: string[] } {
        this.parameters = [];
        this.parameters.push(this.getWebgl1Parameters());
        if (this.contextVersion > 1) {
            this.parameters.push(this.getWebgl2Parameters());
        }

        const changeCommandsByState: { [key: string]: string[] } = {};
        for (let version = 1; version <= this.contextVersion; version++) {
            if (version > this.parameters.length) {
                break;
            }

            if (!this.parameters[version - 1]) {
                continue;
            }

            for (const parameter of this.parameters[version - 1]) {
                if (parameter.changeCommands) {
                    for (const command of parameter.changeCommands) {
                        changeCommandsByState[parameter.constant.name] = changeCommandsByState[parameter.constant.name] || [];
                        changeCommandsByState[parameter.constant.name].push(command);
                    }
                }
            }
        }
        return changeCommandsByState;
    }

    protected readFromContext(): void {
        for (let version = 1; version <= this.contextVersion; version++) {
            if (version > this.parameters.length) {
                break;
            }

            for (const parameter of this.parameters[version - 1]) {
                const value = this.readParameterFromContext(parameter);
                const tag = WebGlObjects.getWebGlObjectTag(value);
                if (tag) {
                    this.currentState[parameter.constant.name] = tag;
                }
                else {
                    const stringValue = this.stringifyParameterValue(value, parameter);
                    this.currentState[parameter.constant.name] = stringValue;
                }
            }
        }
    }

    protected readParameterFromContext(parameter: IParameter): any {
        if (parameter.constant.extensionName && !this.extensions[parameter.constant.extensionName]) {
            return `Extension ${parameter.constant.extensionName} is unavailble.`;
        }

        const value = this.context.getParameter(parameter.constant.value);
        return value;
    }

    protected stringifyParameterValue(value: any, parameter: IParameter): any {
        if (value === null) {
            return "null";
        }

        if (value === undefined) {
            return "undefined";
        }

        if (parameter.returnType === ParameterReturnType.GlUint) {
            value = value.toString(2);
            value = "00000000000000000000000000000000".substr(value.length) + value;
            return value;
        }

        if (typeof value === "number" && WebGlConstants.isWebGlConstant(value)) {
            if (parameter.returnType === ParameterReturnType.GlEnum) {
                const commandName = parameter.changeCommands ? parameter.changeCommands[0] || "" : "";
                value = WebGlConstants.stringifyWebGlConstant(value, commandName);
                return value;
            }
            else {
                return value;
            }
        }
        else if (value.length && typeof value !== "string") {
            const newValue = [];
            for (let i = 0; i < value.length; i++) {
                newValue.push(value[i]);
            }
            return newValue;
        }

        return value;
    }
}
