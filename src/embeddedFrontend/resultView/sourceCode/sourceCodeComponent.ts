import { BaseComponent, IStateEvent } from "../../mvx/baseComponent";
import { ISourceCodeChangeEvent } from "../resultView";

export interface ISourceCodeState extends ISourceCodeChangeEvent {
    nameVertex: string;
    nameFragment: string;
    fragment: boolean;
    translated: boolean;
    editable: boolean;
    beautify: boolean;
}

// Declare Ace types here.
interface IAceEditorSession {
    setUseSoftTabs(enabled: boolean): void;
    setTabSize(size: number): void;
    setMode(mode: string): void;
    on(eventName: string, callback: (e: any) => void): void;
    setAnnotations(annotations: any[]): void;
}
interface IAceEditor {
    getValue(): string;
    setTheme(theme: string): void;
    getSession(): IAceEditorSession;
    setReadOnly(readonly: boolean): void;
    setShowPrintMargin(show: boolean): void;
}
interface IAceBeautify {
    beautify(session: IAceEditorSession): boolean;
}
type ace = {
    require(path: string): unknown;
    edit(sourceCodeComponent: Element): IAceEditor;
};
declare const ace: ace;

export class SourceCodeComponent extends BaseComponent<ISourceCodeState> {
    public onTranslatedVertexSourceClicked: IStateEvent<ISourceCodeState>;
    public onTranslatedFragmentSourceClicked: IStateEvent<ISourceCodeState>;
    public onVertexSourceClicked: IStateEvent<ISourceCodeState>;
    public onFragmentSourceClicked: IStateEvent<ISourceCodeState>;
    public onSourceCodeCloseClicked: IStateEvent<ISourceCodeState>;
    public onSourceCodeChanged: IStateEvent<ISourceCodeState>;
    public onBeautifyChanged: IStateEvent<ISourceCodeState>;

    private editor: IAceEditor;

    constructor() {
        super();
        this.onTranslatedVertexSourceClicked = this.createEvent("onTranslatedVertexSourceClicked");
        this.onTranslatedFragmentSourceClicked = this.createEvent("onTranslatedFragmentSourceClicked");
        this.onVertexSourceClicked = this.createEvent("onVertexSourceClicked");
        this.onFragmentSourceClicked = this.createEvent("onFragmentSourceClicked");
        this.onSourceCodeCloseClicked = this.createEvent("onSourceCodeCloseClicked");
        this.onSourceCodeChanged = this.createEvent("onSourceCodeChanged");
        this.onBeautifyChanged = this.createEvent("onBeautifyChanged");
    }

    public showError(errorMessage: string) {
        if (!this.editor) {
            return;
        }

        errorMessage = errorMessage || "";

        const annotations = [];

        if (errorMessage) {
            const errorChecker = /^.*ERROR:\W([0-9]+):([0-9]+):(.*)$/gm;
            let errors = errorChecker.exec(errorMessage);
            while (errors != null) {
                annotations.push({
                    row: +errors[2] - 1,
                    column: errors[1],
                    text: errors[3] || "Error",
                    type: "error", // also warning and information
                });
                errors = errorChecker.exec(errorMessage);
            }
        }

        this.editor.getSession().setAnnotations(annotations);
    }

    public render(state: ISourceCodeState, stateId: number): Element {
        const source = state.fragment ? state.sourceFragment : state.sourceVertex;
        let originalShader: string;
        // tslint:disable-next-line:prefer-conditional-expression
        if (state.translated) {
            originalShader = state.fragment ? state.translatedSourceFragment : state.translatedSourceVertex;
        }
        else {
            originalShader = source ?? "";
        }

        const htmlString = this.htmlTemplate`
        <div class="sourceCodeComponentContainer">
            <div class="sourceCodeMenuComponentContainer">
                <ul class="sourceCodeMenuComponent">
                    $${ state.translatedSourceVertex ? this.htmlTemplate`<li><a class="${!state.fragment && state.translated ? "active" : ""}" href="#" role="button" commandName="onTranslatedVertexSourceClicked">Translated Vertex</a></li>` : "" }
                    $${ state.translatedSourceFragment ? this.htmlTemplate`<li><a class="${state.fragment && state.translated ? "active" : ""}" href="#" role="button" commandName="onTranslatedFragmentSourceClicked">Translated Fragment</a></li>` : "" }
                    <li><a class="${!state.fragment && !state.translated ? "active" : ""}" href="#" role="button" commandName="onVertexSourceClicked">Vertex</a></li>
                    <li><a class="${state.fragment && !state.translated ? "active" : ""}" href="#" role="button" commandName="onFragmentSourceClicked">Fragment</a></li>
                    <li><a href="#" role="button" commandName="onSourceCodeCloseClicked">Close</a></li>
                </ul>
            </div>
            $${this.htmlTemplate`<div class="sourceCodeComponent">${originalShader}</div>`}
            <div class="sourceCodeMenuComponentFooter">
                <p>
                    <label><input type="checkbox" commandName="onBeautifyChanged" ${state.beautify ? "checked" : ""} /> Beautify</label>
                </p>
            </div>
        </div>`;

        const element = this.renderElementFromTemplate(htmlString.replace(/<br>/g, "\n"), state, stateId);

        this.editor = ace.edit(element.querySelector(".sourceCodeComponent"));
        this.editor.setTheme("ace/theme/monokai");
        const session = this.editor.getSession();
        session.setMode("ace/mode/glsl");
        if (state.beautify) {
            session.setUseSoftTabs(true);
            session.setTabSize(4);
            const beautify = ace.require("ace/ext/beautify") as IAceBeautify;
            beautify.beautify(session);
        }
        this.editor.setShowPrintMargin(false);
        let timeoutId = -1;
        this.editor.setReadOnly(!state.editable && !state.translated);
        session.on("change", (e) => {
            if (timeoutId !== -1) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                this._triggerCompilation(this.editor, state, element, stateId);
            }, 1500);
        });

        return element;
    }

    private _triggerCompilation(editor: IAceEditor, state: ISourceCodeState, element: Element, stateId: number) {
        if (state.fragment) {
            state.sourceFragment = editor.getValue();
        }
        else {
            state.sourceVertex = editor.getValue();
        }
        this.triggerEvent("onSourceCodeChanged", element, state, stateId);
    }
}
