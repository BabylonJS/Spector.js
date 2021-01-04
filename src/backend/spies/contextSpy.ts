import { WebGLRenderingContexts, IContextInformation } from "../types/contextInformation";
import { ICapture } from "../../shared/capture/capture";
import { ICanvasCapture } from "../../shared/capture/canvasCapture";
import { IContextCapture } from "../../shared/capture/contextCapture";
import { Time } from "../../shared/utils/time";
import { IFunctionInformation } from "../types/functionInformation";
import { merge } from "../../shared/utils/merge";
import { WebGlObjectTag } from "../webGlObjects/baseWebGlObject";
import { CaptureAnalyser } from "../analysers/captureAnalyser";
import { CommandSpy } from "./commandSpy";
import { StateSpy } from "./stateSpy";
import { RecorderSpy } from "./recorderSpy";
import { WebGlObjectSpy } from "./webGlObjectSpy";
import { Observable } from "../../shared/utils/observable";
import { Logger } from "../../shared/utils/logger";
import { Extensions } from "../states/information/extensions";
import { CompressedTextures } from "../states/information/compressedTextures";
import { Capabilities } from "../states/information/capabilities";

export interface IContextSpyOptions {
    context: WebGLRenderingContexts;
    version: number;
    recordAlways?: boolean;
}

export class ContextSpy {

    private static readonly unSpyableMembers = ["canvas",
        "drawingBufferWidth",
        "drawingBufferHeight",
        "glp", // WebGl Insight internal method.
    ];

    public readonly context: WebGLRenderingContexts;
    public readonly version: number;

    public readonly onMaxCommand: Observable<ContextSpy>;

    private readonly contextInformation: IContextInformation;
    private readonly commandSpies: { [key: string]: CommandSpy };
    private readonly stateSpy: StateSpy;
    private readonly recorderSpy: RecorderSpy;
    private readonly webGlObjectSpy: WebGlObjectSpy;

    private marker: string;
    private capturing: boolean;
    private globalCapturing: boolean;
    private commandId: number;
    private currentCapture: ICapture;
    private canvasCapture: ICanvasCapture;
    private contextCapture: IContextCapture;
    private analyser: CaptureAnalyser;
    private maxCommands: number;

    constructor(private readonly options: IContextSpyOptions) {

        this.commandId = 0;
        this.context = options.context;
        this.version = options.version;

        this.onMaxCommand = new Observable<ContextSpy>();

        this.capturing = false;
        this.globalCapturing = true;

        this.contextInformation = {
            context: this.context,
            contextVersion: this.version,
            toggleCapture: this.toggleGlobalCapturing.bind(this),
            tagWebGlObject: this.tagWebGlObject.bind(this),
            extensions: {},
        };

        this.commandSpies = {};
        this.stateSpy = new StateSpy(this.contextInformation);
        this.recorderSpy = new RecorderSpy(this.contextInformation);
        this.webGlObjectSpy = new WebGlObjectSpy(this.contextInformation);
        this.analyser = new CaptureAnalyser(this.contextInformation);

        this.initStaticCapture();

        if (options.recordAlways) {
            this.spy();
        }
    }

    public spy(): void {
        this.spyContext(this.context);
        const { extensions } = this.contextInformation;
        for (const extensionName in extensions) {
            if (extensions.hasOwnProperty(extensionName)) {
                this.spyContext(extensions[extensionName]);
            }
        }
    }

    public unSpy(): void {
        for (const member in this.commandSpies) {
            if (this.commandSpies.hasOwnProperty(member)) {
                this.commandSpies[member].unSpy();
            }
        }
    }

    public startCapture(maxCommands = 0, quickCapture = false, fullCapture = false): void {
        const startTime = Time.now;
        this.maxCommands = maxCommands;

        if (!this.options.recordAlways) {
            this.spy();
        }

        this.capturing = true;
        this.commandId = 0;
        this.currentCapture = {
            canvas: this.canvasCapture,
            context: this.contextCapture,
            commands: [],
            initState: {},
            endState: {},
            startTime,
            listenCommandsStartTime: 0,
            listenCommandsEndTime: 0,
            endTime: 0,
            analyses: [],
            frameMemory: {},
            memory: {},
        };

        // Refreshes canvas info in case it changed beffore the capture.
        this.currentCapture.canvas.width = this.context.canvas.width;
        this.currentCapture.canvas.height = this.context.canvas.height;
        this.currentCapture.canvas.clientWidth = (this.context.canvas as HTMLCanvasElement).clientWidth || this.context.canvas.width;
        this.currentCapture.canvas.clientHeight = (this.context.canvas as HTMLCanvasElement).clientHeight || this.context.canvas.height;

        this.stateSpy.startCapture(this.currentCapture, quickCapture, fullCapture);
        this.recorderSpy.startCapture();

        this.currentCapture.listenCommandsStartTime = Time.now;
    }

    public stopCapture(): ICapture {
        const listenCommandsEndTime = Time.now;
        if (!this.options.recordAlways) {
            this.unSpy();
        }

        this.capturing = false;
        this.stateSpy.stopCapture(this.currentCapture);
        this.recorderSpy.stopCapture();

        this.currentCapture.listenCommandsEndTime = listenCommandsEndTime;
        this.currentCapture.endTime = Time.now;

        this.recorderSpy.appendRecordedInformation(this.currentCapture);
        this.analyser.appendAnalyses(this.currentCapture);
        return this.currentCapture;
    }

    public isCapturing(): boolean {
        return this.globalCapturing && this.capturing;
    }

    public setMarker(marker: string) {
        this.marker = marker;
    }

    public clearMarker() {
        this.marker = null;
    }

    public getNextCommandCaptureId(): number {
        return this.commandId++;
    }

    public onCommand(commandSpy: CommandSpy, functionInformation: IFunctionInformation): void {
        if (!this.globalCapturing) {
            return;
        }

        this.webGlObjectSpy.tagWebGlObjects(functionInformation);
        this.recorderSpy.recordCommand(functionInformation);

        if (this.isCapturing()) {
            const commandCapture = commandSpy.createCapture(functionInformation, this.getNextCommandCaptureId(), this.marker);
            this.stateSpy.captureState(commandCapture);
            this.currentCapture.commands.push(commandCapture);

            commandCapture.endTime = Time.now;

            if (this.maxCommands > 0 && this.currentCapture.commands.length === this.maxCommands) {
                this.onMaxCommand.trigger(this);
            }
        }
    }

    private spyContext(bindingContext: any) {
        const members: string[] = [];
        for (const member in bindingContext) {
            if (member) {
                members.push(member);
            }
        }

        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            if (~ContextSpy.unSpyableMembers.indexOf(member)) {
                continue;
            }

            try {
                const isFunction = typeof bindingContext[member] !== "number";
                if (isFunction) {
                    this.spyFunction(member, bindingContext);
                }
            }
            catch (e) {
                Logger.error("Cant Spy member: " + member);
                Logger.error(e);
            }
        }
    }

    private initStaticCapture(): void {
        const extensionsState = new Extensions(this.contextInformation);
        const extensions = extensionsState.getExtensions();
        for (const extensionName in extensions) {
            if (extensions.hasOwnProperty(extensionName)) {
                this.contextInformation.extensions[extensionName] = extensions[extensionName];
            }
        }

        const capabilitiesState = new Capabilities(this.contextInformation);
        const compressedTextures = new CompressedTextures(this.contextInformation);

        this.contextCapture = {
            version: this.version,
            contextAttributes: this.context.getContextAttributes(),
            capabilities: capabilitiesState.getStateData(),
            extensions: extensionsState.getStateData(),
            compressedTextures: compressedTextures.getStateData(),
        };

        this.canvasCapture = {
            width: this.context.canvas.width,
            height: this.context.canvas.height,
            clientWidth: (this.context.canvas as HTMLCanvasElement).clientWidth || this.context.canvas.width,
            clientHeight: (this.context.canvas as HTMLCanvasElement).clientHeight || this.context.canvas.height,
            browserAgent: navigator ? navigator.userAgent : "",
        };
    }

    private spyFunction(member: string, bindingContext: any) {
        if (member.indexOf("__SPECTOR_Origin_") === 0) {
            return;
        }

        if (!this.commandSpies[member]) {
            const options = merge(this.contextInformation, {
                spiedCommandName: member,
                spiedCommandRunningContext: bindingContext,
                callback: this.onCommand.bind(this),
            });
            this.commandSpies[member] = new CommandSpy(options);
        }
        this.commandSpies[member].spy();
    }

    private toggleGlobalCapturing(capture: boolean) {
        this.globalCapturing = capture;
    }

    private tagWebGlObject(object: any): WebGlObjectTag {
        return this.webGlObjectSpy.tagWebGlObject(object);
    }
}
