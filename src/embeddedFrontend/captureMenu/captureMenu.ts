namespace SPECTOR {
    export interface ICanvasInformation {
        id: string;
        width: number;
        height: number;
        ref: any;
    }

    export interface ICaptureMenu {
        display(): void;
        trackPageCanvases(): void;
        updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void;
        updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void;
        getSelectedCanvasInformation(): ICanvasInformation;
        hide(): void;

        setFPS(fps: number): void;

        readonly onCanvasSelected: IEvent<ICanvasInformation>;
        readonly onCaptureRequested: IEvent<ICanvasInformation>;
        readonly onPauseRequested: IEvent<ICanvasInformation>;
        readonly onPlayRequested: IEvent<ICanvasInformation>;
        readonly onPlayNextFrameRequested: IEvent<ICanvasInformation>;
    }

    export interface ICaptureMenuOptions {
        readonly eventConstructor: EventConstructor;
        readonly rootPlaceHolder?: Element;
        readonly canvas?: HTMLCanvasElement;
    }

    export type CaptureMenuConstructor = {
        new (options: ICaptureMenuOptions, logger: ILogger): ICaptureMenu
    }
}

namespace SPECTOR.EmbeddedFrontend {
    export class CaptureMenu implements ICaptureMenu {
        private readonly rootPlaceHolder: Element;
        private readonly mvx: MVX;

        private readonly captureMenuComponent: CaptureMenuComponent;
        private readonly canvasListItemComponent: CanvasListItemComponent;
        private readonly actionsComponent: CaptureMenuActionsComponent;
        private readonly canvasListComponent: CanvasListComponent;
        private readonly fpsCounterComponent: FpsCounterComponent;

        private readonly rootStateId: number;
        private readonly fpsStateId: number;
        private readonly actionsStateId: number;
        private readonly canvasListStateId: number;

        private visible: boolean;

        public readonly onCanvasSelected: IEvent<ICanvasInformation>;
        public readonly onCaptureRequested: IEvent<ICanvasInformation>;
        public readonly onPauseRequested: IEvent<ICanvasInformation>;
        public readonly onPlayRequested: IEvent<ICanvasInformation>;
        public readonly onPlayNextFrameRequested: IEvent<ICanvasInformation>;

        constructor(private readonly options: ICaptureMenuOptions, private readonly logger: ILogger) {
            this.rootPlaceHolder = options.rootPlaceHolder || document.body;
            this.mvx = new MVX(this.rootPlaceHolder, logger);

            this.visible = true;

            this.onCanvasSelected = new options.eventConstructor<ICanvasInformation>();
            this.onCaptureRequested = new options.eventConstructor<ICanvasInformation>();
            this.onPauseRequested = new options.eventConstructor<ICanvasInformation>();
            this.onPlayRequested = new options.eventConstructor<ICanvasInformation>();
            this.onPlayNextFrameRequested = new options.eventConstructor<ICanvasInformation>();

            this.captureMenuComponent = new CaptureMenuComponent(options.eventConstructor, logger);
            this.canvasListComponent = new CanvasListComponent(options.eventConstructor, logger);
            this.canvasListItemComponent = new CanvasListItemComponent(this.options.eventConstructor, this.logger);
            this.actionsComponent = new CaptureMenuActionsComponent(options.eventConstructor, logger);
            this.fpsCounterComponent = new FpsCounterComponent(options.eventConstructor, logger);

            this.rootStateId = this.mvx.addRootState(null, this.captureMenuComponent);
            this.canvasListStateId = this.mvx.addChildState(this.rootStateId, { currentCanvasInformation: null, showList: false }, this.canvasListComponent);
            this.actionsStateId = this.mvx.addChildState(this.rootStateId, true, this.actionsComponent);
            this.fpsStateId = this.mvx.addChildState(this.rootStateId, 0, this.fpsCounterComponent);

            this.actionsComponent.onCaptureRequested.add(_ => {
                this.onCaptureRequested.trigger(this.getSelectedCanvasInformation());
            });
            this.actionsComponent.onPauseRequested.add(_ => {
                this.onPauseRequested.trigger(this.getSelectedCanvasInformation());
                this.mvx.updateState(this.actionsStateId, false);
            });
            this.actionsComponent.onPlayRequested.add(_ => {
                this.onPlayRequested.trigger(this.getSelectedCanvasInformation());
                this.mvx.updateState(this.actionsStateId, true);
            });
            this.actionsComponent.onPlayNextFrameRequested.add(_ => {
                this.onPlayNextFrameRequested.trigger(this.getSelectedCanvasInformation());
            });

            this.canvasListComponent.onCanvasSelection.add((eventArgs) => {
                this.mvx.updateState(this.canvasListStateId, {
                    currentCanvasInformation: null,
                    showList: !eventArgs.state.showList
                });
                this.onCanvasSelected.trigger(null);
            });

            this.canvasListItemComponent.onCanvasSelected.add((eventArgs) => {
                this.mvx.updateState(this.canvasListStateId, {
                    currentCanvasInformation: eventArgs.state,
                    showList: false
                });
                this.onCanvasSelected.trigger(eventArgs.state);
            });

            this.updateMenuState();
        }

        public getSelectedCanvasInformation(): ICanvasInformation {
            const canvasListState = this.mvx.getGenericState<ICanvasListComponentState>(this.canvasListStateId);
            return canvasListState.currentCanvasInformation;
        }

        public trackPageCanvases(): void {
            if (document.body) {
                const canvases = document.body.querySelectorAll("canvas");
                this.updateCanvasesList(canvases);
            }
            setTimeout(this.trackPageCanvases.bind(this), 5000);
        }

        public updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void {
            this.mvx.removeChildrenStates(this.canvasListStateId);
            let canvasToSelect: ICanvasInformation = null;
            let canvasesCount = 0;

            for (let i = 0; i < canvases.length; i++) {
                const canvas = canvases[i];

                var context = null;
                try {
                    context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                }
                catch (e) {
                    // Do Nothing.
                }

                if (!context) {
                    try {
                        context = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2");
                    }
                    catch (e) {
                        // Do Nothing.
                    }
                }

                if (context) {
                    canvasToSelect = {
                        id: canvas.id,
                        width: canvas.width,
                        height: canvas.height,
                        ref: canvas
                    };
                    canvasesCount++;
                    this.mvx.addChildState(this.canvasListStateId, canvasToSelect, this.canvasListItemComponent);
                }
            }

            const visible = this.mvx.getGenericState<ICanvasListComponentState>(this.canvasListStateId).showList;
            if (canvasesCount === 1 && canvasToSelect && !visible) {
                this.mvx.updateState(this.canvasListStateId, {
                    currentCanvasInformation: canvasToSelect,
                    showList: visible
                });
                this.onCanvasSelected.trigger(canvasToSelect);
            }
            else {
                this.onCanvasSelected.trigger(null);
            }
        }

        public updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void {
            this.mvx.removeChildrenStates(this.canvasListStateId);
            let canvasToSelect: ICanvasInformation = null;
            let canvasesCount = canvasesInformation.length;
            for (let i = 0; i < canvasesInformation.length; i++) {
                const canvas = canvasesInformation[i];
                canvasToSelect = {
                    id: canvas.id,
                    width: canvas.width,
                    height: canvas.height,
                    ref: canvas.ref
                };
                this.mvx.addChildState(this.canvasListStateId, canvasToSelect, this.canvasListItemComponent);
            }

            const visible = this.mvx.getGenericState<ICanvasListComponentState>(this.canvasListStateId).showList;
            if (canvasesCount === 1 && canvasToSelect && !visible) {
                this.mvx.updateState(this.canvasListStateId, {
                    currentCanvasInformation: canvasToSelect,
                    showList: visible
                });
                this.onCanvasSelected.trigger(canvasToSelect);
            }
            else {
                this.onCanvasSelected.trigger(null);
            }
        }

        public display(): void {
            this.visible = true;
            this.updateMenuState();
        }

        public hide(): void {
            this.visible = false;
            this.updateMenuState();
        }

        public setFPS(fps: number): void {
            this.mvx.updateState(this.fpsStateId, fps);
        }

        private updateMenuState() {
            this.mvx.updateState(this.rootStateId, this.visible);
        }
    }
}
