import { Observable } from "../../../shared/utils/observable";
import { ICapture } from "../../../shared/capture/capture";
import { BaseComponent } from "../../mvx/baseComponent";
import { Logger } from "../../../shared/utils/logger";

export class CaptureListComponent extends BaseComponent<boolean> {
    public onCaptureLoaded: Observable<ICapture>;

    constructor() {
        super();
        this.onCaptureLoaded = new Observable<ICapture>();
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
        if (event && event.target && (event as any).target.files) {
            filesToLoad = (event as any).target.files;
        }

        // Load the files.
        if (filesToLoad && filesToLoad.length > 0) {
            for (let i = 0; i < filesToLoad.length; i++) {
                const name = filesToLoad[i].name.toLowerCase();
                const extension = name.split(".").pop();
                const type = filesToLoad[i].type;

                if (extension === "json") {
                    const fileToLoad = filesToLoad[i];

                    const reader = new FileReader();
                    reader.onerror = (e) => {
                        Logger.error("Error while reading file: " + fileToLoad.name + e);
                    };
                    reader.onload = (e) => {
                        // target doesn't have result from ts 1.3
                        try {
                            const capture = JSON.parse((e as any).target["result"]);
                            this.onCaptureLoaded.trigger(capture);
                        }
                        catch (exception) {
                            Logger.error("Error while reading file: " + fileToLoad.name + exception);
                        }
                    };
                    reader.readAsText(fileToLoad);
                }
            }
        }
    }
}
