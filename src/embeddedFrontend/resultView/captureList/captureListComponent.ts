namespace SPECTOR.EmbeddedFrontend {
    export class CaptureListComponent extends BaseComponent<boolean> {
        public onCaptureLoaded: IEvent<ICapture>;

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
            this.onCaptureLoaded = new this.eventConstructor<ICapture>();
        }

        public render(state: boolean, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <div class="captureListComponent ${state ? "active" : ""}">
                <div class="openCaptureFile">
                    <Span>Drag files here to open a previously saved capture.</span>
                </div>
                <ul childrenContainer="true"></ul>
            </div>`;

            const element = this.renderElementFromTemplate(htmlString, state, stateId);

            const openCaptureFileElement = element.querySelector(".openCaptureFile");
            openCaptureFileElement.addEventListener("dragenter", (e: DragEvent) => { this.drag(e); return false; }, false);
            openCaptureFileElement.addEventListener("dragover", (e: DragEvent) => { this.drag(e); return false; }, false);
            openCaptureFileElement.addEventListener("drop", (e: DragEvent) => { this.drop(e); }, false);

            return element;
        }

        private drag(e: DragEvent): void {
            e.stopPropagation();
            e.preventDefault();
        }

        private drop(eventDrop: DragEvent): void {
            eventDrop.stopPropagation();
            eventDrop.preventDefault();

            this.loadFiles(eventDrop);
        }

        private loadFiles(event: DragEvent): void {
            let filesToLoad: any = null;

            // Handling data transfer via drag'n'drop
            if (event && event.dataTransfer && event.dataTransfer.files) {
                filesToLoad = event.dataTransfer.files;
            }

            // Handling files from input files
            if (event && event.target && (<any>event).target.files) {
                filesToLoad = (<any>event).target.files;
            }

            // Load the files.
            if (filesToLoad && filesToLoad.length > 0) {
                for (let i = 0; i < filesToLoad.length; i++) {
                    let name = filesToLoad[i].name.toLowerCase();
                    let extension = name.split('.').pop();
                    let type = filesToLoad[i].type;

                    if (extension === "json") {
                        const fileToLoad = filesToLoad[i];

                        const reader = new FileReader();
                        reader.onerror = e => {
                            this.logger.error("Error while reading file: " + fileToLoad.name + e);
                        };
                        reader.onload = e => {
                            //target doesn't have result from ts 1.3
                            try {
                                const capture = JSON.parse((<any>e).target['result']);
                                this.onCaptureLoaded.trigger(capture);
                            }
                            catch (exception) {
                                this.logger.error("Error while reading file: " + fileToLoad.name + exception);
                            }
                        };
                        reader.readAsText(fileToLoad);
                    }
                }
            }
        }
    }
}
