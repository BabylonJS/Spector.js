namespace SPECTOR {

    export interface IResultView {
        display(): void;
        hide(): void;

        addCapture(capture: ICapture): number;
        selectCapture(captureId: number): void;
    }

    export interface IResultViewOptions {
        readonly eventConstructor: EventConstructor;
        readonly rootPlaceHolder?: Element;
    }

    export type ResultViewConstructor = {
        new(options: IResultViewOptions, logger: ILogger): IResultView,
    };
}

namespace SPECTOR.EmbeddedFrontend {
    export class ResultView implements IResultView {
        private readonly rootPlaceHolder: Element;
        private readonly mvx: MVX;

        private readonly captureListComponent: CaptureListComponent;
        private readonly captureListItemComponent: CaptureListItemComponent;
        private readonly visualStateListComponent: VisualStateListComponent;
        private readonly visualStateListItemComponent: VisualStateListItemComponent;
        private readonly commandListComponent: CommandListComponent;
        private readonly commandListItemComponent: CommandListItemComponent;
        private readonly commandDetailComponent: CommandDetailComponent;
        private readonly jsonContentComponent: JSONContentComponent;
        private readonly jsonGroupComponent: JSONGroupComponent;
        private readonly jsonItemComponent: JSONItemComponent;
        private readonly jsonImageItemComponent: JSONImageItemComponent;
        private readonly jsonSourceItemComponent: JSONSourceItemComponent;
        private readonly jsonHelpItemComponent: JSONHelpItemComponent;
        private readonly jsonVisualStateItemComponent: JSONVisualStateItemComponent;
        private readonly resultViewMenuComponent: ResultViewMenuComponent;
        private readonly resultViewContentComponent: ResultViewContentComponent;
        private readonly resultViewComponent: ResultViewComponent;
        private readonly sourceCodeComponent: SourceCodeComponent;
        private readonly informationColumnComponent: InformationColumnComponent;

        private readonly rootStateId: number;
        private readonly menuStateId: number;
        private readonly contentStateId: number;
        private readonly captureListStateId: number;

        private commandListStateId: number;
        private commandDetailStateId: number;
        private visualStateListStateId: number;
        private currentCaptureStateId: number;
        private currentCommandStateId: number;
        private currentVisualStateId: number;
        private initVisualStateId: number;
        private sourceCodeComponentStateId: number;

        private searchText: string;
        private currentCommandId: number;
        private visible: boolean;
        private commandCount: number;

        constructor(private readonly options: IResultViewOptions, private readonly logger: ILogger) {
            this.rootPlaceHolder = options.rootPlaceHolder || document.body;
            this.mvx = new MVX(this.rootPlaceHolder, logger);

            this.searchText = "";
            this.currentCommandId = -1;
            this.visible = false;
            this.commandCount = 0;

            this.commandListStateId = -1;
            this.commandDetailStateId = -1;
            this.currentCaptureStateId = -1;
            this.currentCommandStateId = -1;
            this.currentVisualStateId = -1;
            this.visualStateListStateId = -1;
            this.initVisualStateId = -1;
            this.sourceCodeComponentStateId = -1;

            this.captureListComponent = new CaptureListComponent(options.eventConstructor, logger);
            this.captureListItemComponent = new CaptureListItemComponent(options.eventConstructor, logger);
            this.visualStateListComponent = new VisualStateListComponent(options.eventConstructor, logger);
            this.visualStateListItemComponent = new VisualStateListItemComponent(options.eventConstructor, logger);
            this.commandListComponent = new CommandListComponent(options.eventConstructor, logger);
            this.commandListItemComponent = new CommandListItemComponent(options.eventConstructor, logger);
            this.commandDetailComponent = new CommandDetailComponent(options.eventConstructor, logger);
            this.jsonContentComponent = new JSONContentComponent(options.eventConstructor, logger);
            this.jsonGroupComponent = new JSONGroupComponent(options.eventConstructor, logger);
            this.jsonItemComponent = new JSONItemComponent(options.eventConstructor, logger);
            this.jsonImageItemComponent = new JSONImageItemComponent(options.eventConstructor, logger);
            this.jsonSourceItemComponent = new JSONSourceItemComponent(options.eventConstructor, logger);
            this.jsonHelpItemComponent = new JSONHelpItemComponent(options.eventConstructor, logger);
            this.jsonVisualStateItemComponent = new JSONVisualStateItemComponent(options.eventConstructor, logger);
            this.resultViewMenuComponent = new ResultViewMenuComponent(options.eventConstructor, logger);
            this.resultViewContentComponent = new ResultViewContentComponent(options.eventConstructor, logger);
            this.resultViewComponent = new ResultViewComponent(options.eventConstructor, logger);
            this.sourceCodeComponent = new SourceCodeComponent(options.eventConstructor, logger);
            this.informationColumnComponent = new InformationColumnComponent(options.eventConstructor, logger);

            this.rootStateId = this.mvx.addRootState(null, this.resultViewComponent);
            this.menuStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewMenuComponent);
            this.contentStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewContentComponent);
            this.captureListStateId = this.mvx.addChildState(this.rootStateId, false, this.captureListComponent);

            this.initKeyboardEvents();
            this.initMenuComponent();
            this.captureListComponent.onCaptureLoaded.add((capture) => {
                this.addCapture(capture);
            });
            this.captureListItemComponent.onCaptureSelected.add((captureEventArgs) => {
                this.selectCapture(captureEventArgs.stateId);
            });
            this.captureListItemComponent.onSaveRequested.add((captureEventArgs) => {
                this.saveCapture(captureEventArgs.state.capture);
            });
            this.visualStateListItemComponent.onVisualStateSelected.add((visualStateEventArgs) => {
                this.selectVisualState(visualStateEventArgs.stateId);
            });
            this.commandListItemComponent.onCommandSelected.add((commandEventArgs) => {
                this.selectCommand(commandEventArgs.stateId);
            });
            this.commandListItemComponent.onVertexSelected.add((commandEventArgs) => {
                this.selectCommand(commandEventArgs.stateId);
                this.openShader(false);
            });
            this.commandListItemComponent.onFragmentSelected.add((commandEventArgs) => {
                this.selectCommand(commandEventArgs.stateId);
                this.openShader(true);
            });
            this.sourceCodeComponent.onSourceCodeCloseClicked.add(() => {
                this.displayCurrentCapture();
            });
            this.sourceCodeComponent.onVertexSourceClicked.add((sourceCodeState) => {
                const state = this.mvx.getGenericState<ISourceCodeState>(this.sourceCodeComponentStateId);
                state.fragment = false;
                this.mvx.updateState(this.sourceCodeComponentStateId, state);
            });
            this.sourceCodeComponent.onFragmentSourceClicked.add((sourceCodeState) => {
                const state = this.mvx.getGenericState<ISourceCodeState>(this.sourceCodeComponentStateId);
                state.fragment = true;
                this.mvx.updateState(this.sourceCodeComponentStateId, state);
            });
            this.jsonSourceItemComponent.onOpenSourceClicked.add((sourceEventArg) => {
                this.openShader(sourceEventArg.state.value === "FRAGMENT_SHADER");
            });

            this.updateViewState();
        }
        public saveCapture(capture: ICapture): void {
            const captureInString = JSON.stringify(capture, null, 4);
            const blob = new Blob([captureInString], { type: "octet/stream" });
            const fileName = "capture " + new Date(capture.startTime).toTimeString().split(" ")[0] + ".json";

            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, fileName);
            }
            else {
                const a = document.createElement("a");
                const url = window.URL.createObjectURL(blob);
                a.setAttribute("href", url);
                a.setAttribute("download", fileName);
                a.click();
            }
        }

        public selectCapture(captureStateId: number): void {
            this.currentCommandId = -1;
            this.currentCaptureStateId = captureStateId;
            this.displayCurrentCapture();
        }

        public selectCommand(commandStateId: number): void {
            this.currentCommandStateId = commandStateId;
            this.currentVisualStateId = this.displayCurrentCommand();
            this.displayCurrentVisualState();
        }

        public selectVisualState(visualStateId: number): void {
            this.currentVisualStateId = visualStateId;
            this.currentCommandStateId = this.displayCurrentVisualState();
            this.displayCurrentCommand();
        }

        public display(): void {
            this.visible = true;
            this.updateViewState();
        }

        public hide(): void {
            this.visible = false;
            this.updateViewState();
        }

        public addCapture(capture: ICapture): number {
            const captureSateId = this.mvx.insertChildState(this.captureListStateId, {
                capture,
                active: false,
            },
                0, this.captureListItemComponent);
            this.selectCapture(captureSateId);
            return captureSateId;
        }

        private initKeyboardEvents(): void {
            this.rootPlaceHolder.addEventListener("keydown", (event) => {
                if (this.mvx.getGenericState<IResultViewMenuState>(this.menuStateId).status !== MenuStatus.Commands) {
                    return;
                }

                if ((event as any).keyCode === 38) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectPreviousCommand();
                }
                else if ((event as any).keyCode === 40) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectNextCommand();
                }
                else if ((event as any).keyCode === 33) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectPreviousVisualState();
                }
                else if ((event as any).keyCode === 34) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectNextVisualState();
                }
            });
        }

        private openShader(fragment: boolean): void {
            this.mvx.removeChildrenStates(this.contentStateId);
            const commandState = this.mvx.getGenericState<ICommandListItemState>(this.currentCommandStateId);
            this.sourceCodeComponentStateId = this.mvx.addChildState(this.contentStateId, {
                nameVertex: commandState.capture.DrawCall.shaders[0].name,
                nameFragment: commandState.capture.DrawCall.shaders[1].name,
                sourceVertex: commandState.capture.DrawCall.shaders[0].source,
                sourceFragment: commandState.capture.DrawCall.shaders[1].source,
                fragment,
            }, this.sourceCodeComponent);

            this.commandDetailStateId = this.mvx.addChildState(this.contentStateId, null, this.commandDetailComponent);
            this.displayCurrentCommandDetail(commandState);
        }

        private selectPreviousCommand(): void {
            const commandState = this.mvx.getGenericState<ICommandListItemState>(this.currentCommandStateId);
            if (commandState.previousCommandStateId < 0) {
                return;
            }

            this.selectCommand(commandState.previousCommandStateId);
        }

        private selectNextCommand(): void {
            const commandState = this.mvx.getGenericState<ICommandListItemState>(this.currentCommandStateId);
            if (commandState.nextCommandStateId < 0) {
                return;
            }

            this.selectCommand(commandState.nextCommandStateId);
        }

        private selectPreviousVisualState(): void {
            const visualState = this.mvx.getGenericState<IVisualStateItem>(this.currentVisualStateId);
            if (visualState.previousVisualStateId < 0) {
                return;
            }

            this.selectVisualState(visualState.previousVisualStateId);
        }

        private selectNextVisualState(): void {
            const visualState = this.mvx.getGenericState<IVisualStateItem>(this.currentVisualStateId);
            if (visualState.nextVisualStateId < 0) {
                return;
            }

            this.selectVisualState(visualState.nextVisualStateId);
        }

        private initMenuComponent(): void {
            this.mvx.updateState(this.menuStateId, {
                status: MenuStatus.Captures,
                searchText: this.searchText,
                commandCount: 0,
            });
            this.resultViewMenuComponent.onCloseClicked.add((_) => {
                this.hide();
            });

            this.resultViewMenuComponent.onCapturesClicked.add((_) => {
                this.displayCaptures();
            });

            this.resultViewMenuComponent.onCommandsClicked.add((_) => {
                this.displayCurrentCapture();
            });
            this.resultViewMenuComponent.onInformationClicked.add((_) => {
                this.displayInformation();
            });
            this.resultViewMenuComponent.onInitStateClicked.add((_) => {
                this.displayInitState();
            });
            this.resultViewMenuComponent.onEndStateClicked.add((_) => {
                this.displayEndState();
            });
            this.resultViewMenuComponent.onSearchTextChanged.add((menu) => {
                this.search((menu.sender as HTMLInputElement).value);
            });
            this.resultViewMenuComponent.onSearchTextCleared.add((menu) => {
                this.mvx.updateState(this.menuStateId, {
                    status: menu.state.status,
                    searchText: "",
                    commandCount: menu.state.commandCount,
                });
                this.search("");
            });
        }

        private onCaptureRelatedAction(menuStatus: MenuStatus): ICapture {
            const captureState = this.mvx.getGenericState<ICaptureListItemState>(this.currentCaptureStateId);
            this.commandCount = captureState.capture.commands.length;
            this.mvx.removeChildrenStates(this.contentStateId);
            this.mvx.updateState(this.menuStateId, {
                status: menuStatus,
                searchText: this.searchText,
                commandCount: this.commandCount,
            });
            if (this.mvx.getGenericState<boolean>(this.captureListStateId)) {
                this.mvx.updateState(this.captureListStateId, false);
            }
            return captureState.capture;
        }

        private displayCaptures(): void {
            this.mvx.updateState(this.menuStateId, {
                status: MenuStatus.Captures,
                searchText: this.searchText,
                commandCount: this.commandCount,
            });
            this.mvx.updateState(this.captureListStateId, true);
        }

        private displayInformation(): void {
            const capture = this.onCaptureRelatedAction(MenuStatus.Information);

            const leftId = this.mvx.addChildState(this.contentStateId, true, this.informationColumnComponent);
            const rightId = this.mvx.addChildState(this.contentStateId, false, this.informationColumnComponent);

            const leftJsonContentStateId = this.mvx.addChildState(leftId, null, this.jsonContentComponent);
            this.displayJSONGroup(leftJsonContentStateId, "Canvas", capture.canvas);
            this.displayJSONGroup(leftJsonContentStateId, "Context", capture.context);

            const rightJsonContentStateId = this.mvx.addChildState(rightId, null, this.jsonContentComponent);
            for (const analysis of capture.analyses) {
                this.displayJSONGroup(rightJsonContentStateId, analysis.analyserName, analysis);
            }
            this.displayJSONGroup(rightJsonContentStateId, "Frame Memory Changes", capture.frameMemory);
            this.displayJSONGroup(rightJsonContentStateId, "Total Memory (seconds since application start: bytes)", capture.memory);
        }

        private displayJSON(parentGroupId: number, json: any) {
            if (json.VisualState) {
                this.mvx.addChildState(parentGroupId, json.VisualState, this.jsonVisualStateItemComponent);
            }

            for (const key in json) {
                if (key === "VisualState" || key === "analyserName") {
                    continue;
                }

                const value = json[key];
                if (key === "source") {
                    this.mvx.addChildState(parentGroupId, {
                        key,
                        value: json["SHADER_TYPE"],
                    }, this.jsonSourceItemComponent);
                }
                else if (key === "visual") {
                    for (const target in value) {
                        if (value.hasOwnProperty(target) && value[target]) {
                            try {
                                value[target].realSize.then((url: any) => {
                                    this.mvx.addChildState(parentGroupId, {
                                        key: target,
                                        thumbnail: value[target].thumbnail,
                                        realSize: url,
                                    }, this.jsonImageItemComponent);
                                });
                                value[target].realSize.catch(() => {
                                    this.mvx.addChildState(parentGroupId, {
                                        key: target,
                                        thumbnail: value[target].thumbnail,
                                        realSize: null,
                                    }, this.jsonImageItemComponent);
                                });
                            } catch (e) {
                                this.mvx.addChildState(parentGroupId, {
                                    key: target,
                                    thumbnail: value[target].thumbnail,
                                    realSize: null,
                                }, this.jsonImageItemComponent);
                            }
                        }
                    }
                }
                else {
                    const result = this.getJSONAsString(parentGroupId, key, value);
                    if (result === null || result === undefined) {
                        continue;
                    }
                    else if (this.toFilter(key) && this.toFilter(value)) {
                        continue;
                    }

                    this.mvx.addChildState(parentGroupId, {
                        key,
                        value: result,
                    }, this.jsonItemComponent);
                }

                if (value && value.__SPECTOR_Metadata) {
                    this.displayJSONGroup(parentGroupId, "Metadata", value.__SPECTOR_Metadata);
                }
            }
        }

        private getJSONAsString(parentGroupId: number, key: string, json: any): string {
            if (json === null) {
                return "null";
            }

            if (json === undefined) {
                return "undefined";
            }

            if (typeof json === "number") {
                // Do not consider the isFinite case yet for browser compat.
                if (Math.floor(json) === json) {
                    return json.toFixed(0);
                }

                return json.toFixed(4);
            }

            if (typeof json === "string") {
                return json;
            }

            if (typeof json === "boolean") {
                return json ? "true" : "false";
            }

            if (json.length === 0) {
                return "Empty Array";
            }

            if (json.length) {
                const arrayResult: any[] = [];
                for (let i = 0; i < json.length; i++) {
                    const resultItem = this.getJSONAsString(parentGroupId, `${key}(${i.toFixed(0)})`, json[i]);
                    if (resultItem !== null) {
                        arrayResult.push(resultItem);
                    }
                }
                return arrayResult.length === 0 ? null : arrayResult.join(", ");
            }

            if (json.help) {
                this.mvx.addChildState(parentGroupId, {
                    key,
                    value: json.name,
                    help: json.help,
                }, this.jsonHelpItemComponent);
                return null;
            }

            if (json.__SPECTOR_Object_TAG) {
                return json.__SPECTOR_Object_TAG.displayText;
            }

            if (json.displayText) {
                return json.displayText;
            }

            if (typeof json === "object") {
                this.displayJSONGroup(parentGroupId, key, json);
            }

            return null;
        }

        private displayJSONGroup(parentGroupId: number, title: string, json: any) {
            if (!json) {
                return;
            }

            const groupId = this.mvx.addChildState(parentGroupId, title, this.jsonGroupComponent);
            this.displayJSON(groupId, json);
            if (!this.mvx.hasChildren(groupId)) {
                this.mvx.removeState(groupId);
            }
        }

        private displayInitState(): void {
            const capture = this.onCaptureRelatedAction(MenuStatus.InitState);

            const jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
            this.displayJSON(jsonContentStateId, capture.initState);
        }

        private displayEndState(): void {
            const capture = this.onCaptureRelatedAction(MenuStatus.EndState);

            const jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
            this.displayJSON(jsonContentStateId, capture.endState);
        }

        private displayCurrentCapture(): void {
            const capture = this.onCaptureRelatedAction(MenuStatus.Commands);
            this.mvx.updateAllChildrenGenericState<ICaptureListItemState>(this.captureListStateId,
                (state) => { state.active = false; return state; },
            );
            this.mvx.updateState(this.currentCaptureStateId, {
                capture,
                active: true,
            });

            this.createVisualStates(capture);
            this.commandListStateId = this.mvx.addChildState(this.contentStateId, null, this.commandListComponent);
            this.commandDetailStateId = this.mvx.addChildState(this.contentStateId, null, this.commandDetailComponent);

            this.createCommands(capture);
        }

        private displayCurrentCommand(): number {
            if (this.mvx.getGenericState<IResultViewMenuState>(this.menuStateId).status !== MenuStatus.Commands) {
                return -1;
            }

            const commandState = this.mvx.getGenericState<ICommandListItemState>(this.currentCommandStateId);
            const command = commandState.capture;
            this.currentCommandId = command.id;

            this.mvx.updateAllChildrenGenericState<ICommandListItemState>(this.commandListStateId,
                (state) => { state.active = false; return state; },
            );
            this.mvx.updateState(this.currentCommandStateId, {
                capture: command,
                visualStateId: commandState.visualStateId,
                previousCommandStateId: commandState.previousCommandStateId,
                nextCommandStateId: commandState.nextCommandStateId,
                active: true,
            });

            return this.displayCurrentCommandDetail(commandState);
        }

        private displayCurrentCommandDetail(commandState: ICommandListItemState): number {
            const command = commandState.capture;
            this.mvx.removeChildrenStates(this.commandDetailStateId);

            const visualState = this.mvx.getGenericState<any>(commandState.visualStateId);
            this.mvx.addChildState(this.commandDetailStateId, visualState.VisualState, this.jsonVisualStateItemComponent);

            let status: string = "Unknown";
            switch (command.status) {
                case CommandCaptureStatus.Deprecated:
                    status = "Deprecated";
                    break;
                case CommandCaptureStatus.Unused:
                    status = "Unused";
                    break;
                case CommandCaptureStatus.Disabled:
                    status = "Disabled";
                    break;
                case CommandCaptureStatus.Redundant:
                    status = "Redundant";
                    break;
                case CommandCaptureStatus.Valid:
                    status = "Valid";
                    break;
            }

            const helpLink = MDNCommandLinkHelper.getMDNLink(command.name);
            if (command.result) {
                this.displayJSONGroup(this.commandDetailStateId, "Global", {
                    name: { help: helpLink, name: command.name },
                    duration: command.commandEndTime - command.startTime,
                    result: command.result,
                    status,
                });
            }
            else {
                this.displayJSONGroup(this.commandDetailStateId, "Global", {
                    name: { help: helpLink, name: command.name },
                    duration: command.commandEndTime - command.startTime,
                    status,
                });
            }

            for (const key in command) {
                if (key === "VisualState" || key === "result") {
                    continue;
                }
                else if (typeof command[key] === "object") {
                    this.displayJSONGroup(this.commandDetailStateId, key, command[key]);
                }
            }

            return commandState.visualStateId;
        }

        private displayCurrentVisualState(): number {
            if (this.mvx.getGenericState<IResultViewMenuState>(this.menuStateId).status !== MenuStatus.Commands) {
                return null;
            }

            const visualState = this.mvx.getGenericState<IVisualStateItem>(this.currentVisualStateId);
            if (visualState.commandStateId === Number.MIN_VALUE) {
                this.displayInitState();
            }
            else if (visualState.commandStateId === Number.MAX_VALUE) {
                this.displayEndState();
            }

            this.mvx.updateAllChildrenGenericState<IVisualStateItem>(this.visualStateListStateId,
                (state) => { state.active = false; return state; },
            );
            visualState.active = true;
            this.mvx.updateState(this.currentVisualStateId, visualState);

            return visualState.commandStateId;
        }

        private createVisualStates(capture: ICapture): void {
            this.visualStateListStateId = this.mvx.addChildState(this.contentStateId, null, this.visualStateListComponent);

            this.mvx.removeChildrenStates(this.visualStateListStateId);

            this.initVisualStateId = this.mvx.addChildState(this.visualStateListStateId, {
                VisualState: capture.initState.VisualState,
                time: capture.startTime,
                commandStateId: Number.MIN_VALUE,
                active: false,
            }, this.visualStateListItemComponent);
        }

        private createCommands(capture: ICapture): void {
            this.mvx.removeChildrenStates(this.commandListStateId);
            let tempVisualStateId = this.initVisualStateId;
            let visualStateSet = false;

            let previousCommandState: ICommandListItemState = null;
            let previousCommandStateId = -1;

            let previousVisualState: IVisualStateItem = null;
            let previousVisualStateId = -1;

            for (let i = 0; i < capture.commands.length; i++) {
                const commandCapture = capture.commands[i];
                if (this.toFilter(commandCapture.marker) && this.toFilter(commandCapture.name) && commandCapture.id !== this.currentCommandId) {
                    continue;
                }

                const commandState: ICommandListItemState = {
                    capture: commandCapture,
                    previousCommandStateId,
                    nextCommandStateId: -1,
                    visualStateId: undefined as number,
                    active: false,
                };

                const commandStateId = this.mvx.addChildState(this.commandListStateId,
                    commandState,
                    this.commandListItemComponent);

                if (previousCommandState) {
                    previousCommandState = this.mvx.getGenericState<ICommandListItemState>(previousCommandStateId);
                    previousCommandState.nextCommandStateId = commandStateId;
                    this.mvx.updateState(previousCommandStateId, previousCommandState);
                }

                previousCommandStateId = commandStateId;
                previousCommandState = commandState;

                if (commandCapture.VisualState) {
                    const visualState = {
                        VisualState: commandCapture.VisualState,
                        time: commandCapture.endTime,
                        commandStateId,
                        active: false,
                        previousVisualStateId,
                        nextVisualStateId: -1,
                    };

                    tempVisualStateId = this.mvx.addChildState(this.visualStateListStateId,
                        visualState,
                        this.visualStateListItemComponent);

                    if (previousVisualState) {
                        previousVisualState = this.mvx.getGenericState<IVisualStateItem>(previousVisualStateId);
                        previousVisualState.nextVisualStateId = tempVisualStateId;
                        this.mvx.updateState(previousVisualStateId, previousVisualState);
                    }

                    previousVisualState = visualState;
                    previousVisualStateId = tempVisualStateId;
                    visualStateSet = true;
                }
                else if (!visualStateSet) {
                    const initVisualState = this.mvx.getGenericState<IVisualStateItem>(this.initVisualStateId);
                    initVisualState.commandStateId = commandStateId;
                    initVisualState.previousVisualStateId = -1;
                    initVisualState.nextVisualStateId = -1;
                    this.mvx.updateState(this.initVisualStateId, initVisualState);

                    previousVisualState = initVisualState;
                    previousVisualStateId = tempVisualStateId;
                    visualStateSet = true;
                }

                commandState.visualStateId = tempVisualStateId;

                this.mvx.updateState(commandStateId, commandState);

                if ((this.currentCommandId === -1 && i === 0)
                    || (this.currentCommandId === commandCapture.id)) {
                    this.currentCommandStateId = commandStateId;
                    this.displayCurrentCommand();

                    this.currentVisualStateId = tempVisualStateId;
                    this.displayCurrentVisualState();
                }
            }
        }

        private updateViewState() {
            this.mvx.updateState(this.rootStateId, this.visible);
        }

        private toFilter(text: string): boolean {
            text += "";
            text = text.toLowerCase();

            if (this.searchText && this.searchText.length > 2 && text.indexOf(this.searchText.toLowerCase()) === -1) {
                return true;
            }
            return false;
        }

        private search(text: string): void {
            this.searchText = text;
            const status = this.mvx.getGenericState<IResultViewMenuState>(this.menuStateId).status;
            switch (status) {
                case MenuStatus.Captures:
                    this.displayCurrentCapture();
                    break;
                case MenuStatus.Commands:
                    this.displayCurrentCapture();
                    break;
                case MenuStatus.EndState:
                    this.displayEndState();
                    break;
                case MenuStatus.Information:
                    this.displayInformation();
                    break;
                case MenuStatus.InitState:
                    this.displayInitState();
                    break;
            }
            this.searchText = "";
        }
    }
}
