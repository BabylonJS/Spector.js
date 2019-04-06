import { BaseNoneGenericComponent } from "./baseComponent";
import { LastOperation } from "./stateStore";

export class ComponentInstance {
    private static idGenerator: number = 0;

    private readonly component: BaseNoneGenericComponent;

    private cachedCurrentChildrenContainer: Element;
    private cachedCurrentDomNode: Element;

    private domNode: Element;

    constructor(component: BaseNoneGenericComponent) {
        this.component = component;
    }

    public render(state: {}, stateId: number, lastOperation: LastOperation): void {
        if (lastOperation === LastOperation.Processed) {
            return;
        }
        if (lastOperation === LastOperation.Delete) {
            this.removeNode();
            return;
        }
        this.domNode = this.component.render(state, stateId);
    }

    public composeInContainer(parentContainer: Element, indexInContainer: number, lastOperation: LastOperation): Element {
        if (lastOperation === LastOperation.Delete) {
            this.removeNode();
            return null;
        }

        const currentChildrenContainer = this.cachedCurrentChildrenContainer;
        if (lastOperation === LastOperation.Processed) {
            return currentChildrenContainer;
        }

        const element = this.domNode;
        const newChildrenContainer = element.getAttribute("childrencontainer") ? element : element.querySelector("[childrenContainer]");
        if (newChildrenContainer && currentChildrenContainer) {
            const children = currentChildrenContainer.children;
            while (children.length > 0) {
                newChildrenContainer.appendChild(children[0]);
            }
        }
        this.cachedCurrentChildrenContainer = newChildrenContainer;

        if (indexInContainer >= parentContainer.children.length) {
            parentContainer.appendChild(element);
            if (this.cachedCurrentDomNode && lastOperation === LastOperation.Update) {
                if (this.cachedCurrentDomNode.remove) {
                    this.cachedCurrentDomNode.remove();
                }
                else if (this.cachedCurrentDomNode.parentNode) {
                    this.cachedCurrentDomNode.parentNode.removeChild(this.cachedCurrentDomNode);
                }
            }
        }
        else {
            const currentElement = parentContainer.children[indexInContainer];
            parentContainer.insertBefore(element, currentElement);
            if (lastOperation === LastOperation.Update) {
                parentContainer.removeChild(currentElement);
            }
        }

        this.cachedCurrentDomNode = this.domNode;
        return newChildrenContainer;
    }

    private removeNode() {
        if (this.domNode && this.domNode.parentElement) {
            if (this.domNode.remove) {
                this.domNode.remove();
            }
            else if (this.domNode.parentNode) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
        }
        if (this.cachedCurrentDomNode && this.cachedCurrentDomNode.parentElement) {
            if (this.cachedCurrentDomNode.remove) {
                this.cachedCurrentDomNode.remove();
            }
            else if (this.cachedCurrentDomNode.parentNode) {
                this.cachedCurrentDomNode.parentNode.removeChild(this.cachedCurrentDomNode);
            }
        }
    }
}
