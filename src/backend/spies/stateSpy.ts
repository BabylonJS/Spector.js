import { IContextInformation } from "../types/contextInformation";
import { ICapture } from "../../shared/capture/capture";
import { ICommandCapture, CommandCapturedCallbacks } from "../../shared/capture/commandCapture";
import { BaseState } from "../states/baseState";

import { AlignmentState } from "../states/context/alignmentState";
import { BlendState } from "../states/context/blendState";
import { ClearState } from "../states/context/clearState";
import { ColorState } from "../states/context/colorState";
import { CoverageState } from "../states/context/coverageState";
import { CullState } from "../states/context/cullState";
import { DepthState } from "../states/context/depthState";
import { DrawState } from "../states/context/drawState";
import { MipmapHintState } from "../states/context/mipmapHintState";
import { PolygonOffsetState } from "../states/context/polygonOffsetState";
import { ScissorState } from "../states/context/scissorState";
import { StencilState } from "../states/context/stencilState";
import { VisualState } from "../states/context/visualState";
import { DrawCallState } from "../states/drawCalls/drawCallState";

export class StateSpy {
    private readonly stateTrackers: BaseState[];
    private readonly onCommandCapturedCallbacks: CommandCapturedCallbacks;

    constructor(public readonly contextInformation: IContextInformation) {
        this.stateTrackers = [];
        this.onCommandCapturedCallbacks = {};
        this.initStateTrackers();
    }

    public startCapture(currentCapture: ICapture, quickCapture: boolean, fullCapture: boolean): void {
        for (const stateTracker of this.stateTrackers) {
            const state = stateTracker.startCapture(true, quickCapture, fullCapture);
            if (stateTracker.requireStartAndStopStates) {
                currentCapture.initState[stateTracker.stateName] = state;
            }
        }
    }

    public stopCapture(currentCapture: ICapture): void {
        for (const stateTracker of this.stateTrackers) {
            const state = stateTracker.stopCapture();
            if (stateTracker.requireStartAndStopStates) {
                currentCapture.endState[stateTracker.stateName] = state;
            }
        }
    }

    public captureState(commandCapture: ICommandCapture): void {
        const callbacks = this.onCommandCapturedCallbacks[commandCapture.name];
        if (callbacks) {
            for (const callback of callbacks) {
                callback(commandCapture);
            }
        }
    }

    private initStateTrackers(): void {
        this.stateTrackers.push(
            new AlignmentState(this.contextInformation),
            new BlendState(this.contextInformation),
            new ClearState(this.contextInformation),
            new ColorState(this.contextInformation),
            new CoverageState(this.contextInformation),
            new CullState(this.contextInformation),
            new DepthState(this.contextInformation),
            new DrawState(this.contextInformation),
            new MipmapHintState(this.contextInformation),
            new PolygonOffsetState(this.contextInformation),
            new ScissorState(this.contextInformation),
            new StencilState(this.contextInformation),
            new VisualState(this.contextInformation),
            new DrawCallState(this.contextInformation),
        );

        for (const tracker of this.stateTrackers) {
            tracker.registerCallbacks(this.onCommandCapturedCallbacks);
        }
    }
}
