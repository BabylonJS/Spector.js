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
        new (options: IResultViewOptions, logger: ILogger): IResultView
    }
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
        private readonly jsonSourceItemComponent: JSONSourceItemComponent;
        private readonly jsonVisualStateItemComponent: JSONVisualStateItemComponent;
        private readonly resultViewMenuComponent: ResultViewMenuComponent;
        private readonly resultViewContentComponent: ResultViewContentComponent;
        private readonly resultViewComponent: ResultViewComponent;
        private readonly sourceCodeComponent: SourceCodeComponent;

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

        private searchText: string;
        private currentCommandId: number;
        private visible: boolean;

        constructor(private readonly options: IResultViewOptions, private readonly logger: ILogger) {
            this.rootPlaceHolder = options.rootPlaceHolder || document.body;
            this.mvx = new MVX(this.rootPlaceHolder, logger);

            this.searchText = "";
            this.currentCommandId = -1;
            this.visible = false;

            this.commandListStateId = -1;
            this.commandDetailStateId = -1;
            this.currentCaptureStateId = -1;
            this.currentCommandStateId = -1;
            this.currentVisualStateId = -1;
            this.visualStateListStateId = -1;
            this.initVisualStateId = -1;

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
            this.jsonSourceItemComponent = new JSONSourceItemComponent(options.eventConstructor, logger);
            this.jsonVisualStateItemComponent = new JSONVisualStateItemComponent(options.eventConstructor, logger);
            this.resultViewMenuComponent = new ResultViewMenuComponent(options.eventConstructor, logger);
            this.resultViewContentComponent = new ResultViewContentComponent(options.eventConstructor, logger);
            this.resultViewComponent = new ResultViewComponent(options.eventConstructor, logger);
            this.sourceCodeComponent = new SourceCodeComponent(options.eventConstructor, logger);

            this.rootStateId = this.mvx.addRootState(null, this.resultViewComponent);
            this.menuStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewMenuComponent);
            this.contentStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewContentComponent);
            this.captureListStateId = this.mvx.addChildState(this.rootStateId, false, this.captureListComponent);

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
            this.commandListItemComponent.onCommandSelected.add((commandEventArgs) => {
                this.selectCommand(commandEventArgs.stateId);
            });
            this.visualStateListItemComponent.onVisualStateSelected.add((visualStateEventArgs) => {
                this.selectVisualState(visualStateEventArgs.stateId);
            });
            this.jsonSourceItemComponent.onOpenSourceClicked.add((sourceEventArg) => {
                this.mvx.removeChildrenStates(this.contentStateId);
                const jsonContentStateId = this.mvx.addChildState(this.contentStateId, {
                    description: "WebGl Shader Source Code:",
                    source: sourceEventArg.state.value
                }, this.sourceCodeComponent);
            })

            this.updateViewState();
        }

        public saveCapture(capture: ICapture): void {
            const a = document.createElement("a");
            const captureInString = JSON.stringify(capture, null, 4);
            const blob = new Blob([captureInString], { type: "octet/stream" });
            const url = window.URL.createObjectURL(blob);
            a.setAttribute("href", url);
            a.setAttribute("download", "capture " + new Date(capture.startTime).toTimeString().split(' ')[0] + ".json");
            a.click();
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
                capture: capture,
                active: false
            },
                0, this.captureListItemComponent);
            this.selectCapture(captureSateId);
            return captureSateId;
        }

        private initMenuComponent(): void {
            this.mvx.updateState(this.menuStateId, {
                status: MenuStatus.Captures,
                searchText: this.searchText
            });
            this.resultViewMenuComponent.onCloseClicked.add(_ => {
                this.hide();
            });

            this.resultViewMenuComponent.onCapturesClicked.add(_ => {
                this.displayCaptures();
            });

            this.resultViewMenuComponent.onCommandsClicked.add(_ => {
                this.displayCurrentCapture();
            });
            this.resultViewMenuComponent.onInformationClicked.add(_ => {
                this.displayInformation();
            });
            this.resultViewMenuComponent.onInitStateClicked.add(_ => {
                this.displayInitState();
            });
            this.resultViewMenuComponent.onEndStateClicked.add(_ => {
                this.displayEndState();
            });
            this.resultViewMenuComponent.onSearchTextChanged.add(menu => {
                this.search((<HTMLInputElement>menu.sender).value);
            });
            this.resultViewMenuComponent.onSearchTextCleared.add(menu => {
                this.mvx.updateState(this.menuStateId, {
                    status: menu.state.status,
                    searchText: ""
                });
                this.search("");
            });
        }

        private onCaptureRelatedAction(menuStatus: MenuStatus): ICapture {
            this.mvx.removeChildrenStates(this.contentStateId);
            this.mvx.updateState(this.menuStateId, {
                status: menuStatus,
                searchText: this.searchText
            });
            if (this.mvx.getGenericState<boolean>(this.captureListStateId)) {
                this.mvx.updateState(this.captureListStateId, false);
            }
            const captureState = this.mvx.getGenericState<ICaptureListItemState>(this.currentCaptureStateId);
            return captureState.capture;
        }

        private displayCaptures(): void {
            this.mvx.updateState(this.menuStateId, {
                status: MenuStatus.Captures,
                searchText: this.searchText
            });
            this.mvx.updateState(this.captureListStateId, true);
        }

        private displayInformation(): void {
            const capture = this.onCaptureRelatedAction(MenuStatus.Information);

            const jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
            this.displayJSONGroup(jsonContentStateId, "Canvas", capture.canvas);
            this.displayJSONGroup(jsonContentStateId, "Context", capture.context);
        }

        private displayJSON(parentGroupId: number, json: any) {
            if (json.VisualState) {
                this.mvx.addChildState(parentGroupId, json.VisualState, this.jsonVisualStateItemComponent);
            }

            for (const key in json) {
                if (key === "VisualState") {
                    continue;
                }
                else if (key === "source") {
                    const value = json[key];
                    this.mvx.addChildState(parentGroupId, {
                        key: key,
                        value: value
                    }, this.jsonSourceItemComponent);
                }
                else {
                    const value = json[key];

                    let result = this.getJSONAsString(parentGroupId, key, value);
                    if (result === null || result === undefined) {
                        continue;
                    }
                    else if (this.toFilter(key) && this.toFilter(value)) {
                        continue;
                    }
                    this.mvx.addChildState(parentGroupId, {
                        key: key,
                        value: result
                    }, this.jsonItemComponent);
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
                return arrayResult.length == 0 ? null : arrayResult.join(", ");
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
                (state) => { state.active = false; return state; }
            );
            this.mvx.updateState(this.currentCaptureStateId, {
                capture: capture,
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
                (state) => { state.active = false; return state; }
            );
            this.mvx.updateState(this.currentCommandStateId, {
                capture: command,
                visualStateId: commandState.visualStateId,
                active: true,
            });

            this.mvx.removeChildrenStates(this.commandDetailStateId);

            const visualState = this.mvx.getGenericState<any>(commandState.visualStateId);
            this.mvx.addChildState(this.commandDetailStateId, visualState.VisualState, this.jsonVisualStateItemComponent);

            let status: string = "Unknown";
            switch (command.status) {
                case CommandCaptureStatus.Deprecated:
                    status = "Deprecated"
                    break;
                case CommandCaptureStatus.Unused:
                    status = "Unused"
                    break;
                case CommandCaptureStatus.Disabled:
                    status = "Disabled"
                    break;
                case CommandCaptureStatus.Redundant:
                    status = "Redundant"
                    break;
                case CommandCaptureStatus.Valid:
                    status = "Valid"
                    break;
            }

            if (command.result) {
                this.displayJSONGroup(this.commandDetailStateId, "Global", {
                    name: command.name,
                    duration: command.commandEndTime - command.startTime,
                    result: command.result,
                    status: status
                });
            }
            else {
                this.displayJSONGroup(this.commandDetailStateId, "Global", {
                    name: command.name,
                    duration: command.commandEndTime - command.startTime,
                    status: status
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
                (state) => { state.active = false; return state; }
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
            for (let i = 0; i < capture.commands.length; i++) {
                const commandCapture = capture.commands[i];
                if (this.toFilter(commandCapture.name) && commandCapture.id !== this.currentCommandId) {
                    continue;
                }

                const commandStateId = this.mvx.addChildState(this.commandListStateId, {
                    capture: commandCapture,
                    active: false
                }, this.commandListItemComponent);

                if (commandCapture.VisualState) {
                    tempVisualStateId = this.mvx.addChildState(this.visualStateListStateId, {
                        VisualState: commandCapture.VisualState,
                        time: commandCapture.endTime,
                        commandStateId: commandStateId,
                        active: false,
                    }, this.visualStateListItemComponent);
                    visualStateSet = true;
                }
                else if (!visualStateSet) {
                    const initVisualState = this.mvx.getGenericState<IVisualStateItem>(this.initVisualStateId);
                    initVisualState.commandStateId = commandStateId;
                    this.mvx.updateState(this.initVisualStateId, initVisualState);
                    visualStateSet = true;
                }

                this.mvx.updateState(commandStateId, {
                    capture: commandCapture,
                    active: false,
                    visualStateId: tempVisualStateId
                });

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
            if (this.searchText && this.searchText.length > 2 && text.indexOf(this.searchText) === -1) {
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
