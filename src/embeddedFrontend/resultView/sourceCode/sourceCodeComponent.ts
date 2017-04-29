namespace SPECTOR.EmbeddedFrontend {
    export interface ISourceCodeState {
        description: string;
        source: string;
    }

    // Declare Prism types here.
    type Prism = { highlightElement(element: HTMLElement): void; }    
    declare var Prism: Prism;

    export class SourceCodeComponent extends BaseComponent<ISourceCodeState> {
        public render(state: ISourceCodeState, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <div class="sourceCodeComponent">
                <span class="sourceCodeComponentTitle">${state.description}</span>
                <pre class="language-glsl"><code>${state.source}</code></pre>                
            </div>`;

            const element = this.renderElementFromTemplate(htmlString, state, stateId); 

            Prism.highlightElement(element.querySelector('pre'));
            return element;
        }
    }
}