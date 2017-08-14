namespace SPECTOR.EmbeddedFrontend {
    export interface ISourceCodeState {
        nameVertex: string;
        nameFragment: string;
        sourceVertex: string;
        sourceFragment: string;
        fragment: boolean;
    }

    // Declare Prism types here.
    type Prism = { highlightElement(element: HTMLElement): void; };
    declare const Prism: Prism;

    export class SourceCodeComponent extends BaseComponent<ISourceCodeState> {
        public onVertexSourceClicked: IStateEvent<ISourceCodeState>;
        public onFragmentSourceClicked: IStateEvent<ISourceCodeState>;
        public onSourceCodeCloseClicked: IStateEvent<ISourceCodeState>;

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
            this.onVertexSourceClicked = this.createEvent("onVertexSourceClicked");
            this.onFragmentSourceClicked = this.createEvent("onFragmentSourceClicked");
            this.onSourceCodeCloseClicked = this.createEvent("onSourceCodeCloseClicked");
        }

        public render(state: ISourceCodeState, stateId: number): Element {
            const source = state.fragment ? state.sourceFragment : state.sourceVertex;
            const formattedShader = source ? this._indentIfdef(this._beautify(source)) : "";

            const htmlString = this.htmlTemplate`
            <div class="sourceCodeComponentContainer">
                <div class="sourceCodeMenuComponentContainer">
                    <ul class="sourceCodeMenuComponent">
                        <li><a class="${state.fragment ? "" : "active"}" href="#" role="button" commandName="onVertexSourceClicked">Vertex</a></li>
                        <li><a class="${state.fragment ? "active" : ""}" href="#" role="button" commandName="onFragmentSourceClicked">Fragment</a></li>
                        <li><a href="#" role="button" commandName="onSourceCodeCloseClicked">Close</a></li>
                    </ul>
                </div>
                <div class="sourceCodeComponent">
                    <pre class="language-glsl"><code>${formattedShader}</code></pre>
                </div>
            </div>`;

            // Pre and Prism work on the normal carriage return.
            const element = this.renderElementFromTemplate(htmlString.replace(/<br>/g, "\n"), state, stateId);

            Prism.highlightElement(element.querySelector("pre"));
            return element;
        }

        /**
         * Returns the position of the first "{" and the corresponding "}"
         * @param str the Shader source code as a string
         * @param searchFrom Search open brackets from this position
         */
        private _getBracket(str: string, searchFrom = -1): { firstIteration: number, lastIteration: number } {
            const fb = str.indexOf("{", searchFrom);
            const arr = str.substr(fb + 1).split("");
            let counter = 1;
            let currentPosInString = fb;
            let lastBracketIndex = 0;
            for (const char of arr) {
                currentPosInString++;

                if (char === "{") {
                    counter++;
                }
                if (char === "}") {
                    counter--;
                }
                if (counter === 0) {
                    lastBracketIndex = currentPosInString;
                    break;
                }
            }

            // More open than close.
            if (fb > -1 && lastBracketIndex === 0) {
                return this._getBracket(str, fb + 1);
            }

            return { firstIteration: fb, lastIteration: lastBracketIndex };
        }

        /**
         * Beautify the given string : correct indentation according to brackets
         */
        private _beautify(glsl: string, level: number = 0): string {

            // return condition : no brackets at all
            glsl = glsl.trim();
            const brackets = this._getBracket(glsl);
            const firstBracket = brackets.firstIteration;
            const lastBracket = brackets.lastIteration;

            let spaces = "";
            for (let i = 0; i < level; i++) {
                spaces += "    "; // 4 spaces
            }
            // If no brackets, return the indented string
            if (firstBracket === -1) {
                glsl = spaces + glsl; // indent first line
                glsl = glsl.replace(/;(?![^\(]*\))\s*/g, ";\n");
                glsl = glsl.replace(/\s*([*+-/=><\s]*=)\s*/g, (x) => " " + x.trim() + " "); // space around =, *=, +=, -=, /=, ==, >=, <=
                glsl = glsl.replace(/\s*(,)\s*/g, (x) => x.trim() + " "); // space after ,
                glsl = glsl.replace(/\n[ \t]+/g, "\n"); // trim Start
                glsl = glsl.replace(/\n/g, "\n" + spaces); // indentation
                glsl = glsl.replace(/\s+$/g, "");
                glsl = glsl.replace(/\n+$/g, "");
                return glsl;
            }
            else {
                // if brackets, beautify the inside
                // let insideWithBrackets = glsl.substr(firstBracket, lastBracket-firstBracket+1);
                const left = glsl.substr(0, firstBracket);
                const right = glsl.substr(lastBracket + 1, glsl.length);
                const inside = glsl.substr(firstBracket + 1, lastBracket - firstBracket - 1).trim();
                const prettyInside = this._beautify(inside, level + 1);
                const result = this._beautify(left, level) + " {\n" + prettyInside + "\n" + spaces + "}\n" + this._beautify(right, level);
                return result.replace(/\s*\n+\s*;/g, ";"); // Orphan ;
            }
        }

        private _indentIfdef(str: string): string {
            let level = 0;

            const arr2 = str.split("\n");

            for (let index = 0; index < arr2.length; index++) {
                const line = arr2[index];
                if (line.indexOf("#endif") !== -1) {
                    level--;
                }
                if (line.indexOf("#else") !== -1) {
                    level--;
                }
                let spaces = "";
                for (let i = 0; i < level; i++) {
                    spaces += "    "; // 4 spaces
                }
                arr2[index] = spaces + line;
                if (line.indexOf("#if") !== -1 || line.indexOf("#else") !== -1) {
                    level++;
                }
            }
            return arr2.join("\n");
        }
    }
}
