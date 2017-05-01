namespace SPECTOR.EmbeddedFrontend {
    export class ComponentInstance {
        private static idGenerator: number = 0;

        private readonly component: BaseNoneGenericComponent;

        private __cachedCurrentChildrenContainer: Element;
        private __cachedCurrentDomNode: Element;

        private domNode: Element;

        constructor(component: BaseNoneGenericComponent, private readonly logger: ILogger) {
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

            let currentChildrenContainer = this.__cachedCurrentChildrenContainer;
            if (lastOperation === LastOperation.Processed) {
                return currentChildrenContainer;
            }

            const element = this.domNode;
            let newChildrenContainer: Element;
            if (element.getAttribute("childrencontainer")) {
                newChildrenContainer = element;
            }
            else {
                newChildrenContainer = element.querySelector("[childrenContainer]");
            }

            if (newChildrenContainer && currentChildrenContainer) {
                const children = currentChildrenContainer.children;
                while (children.length > 0) {
                    newChildrenContainer.appendChild(children[0]);
                }
            }
            this.__cachedCurrentChildrenContainer = newChildrenContainer;

            if (indexInContainer >= parentContainer.children.length) {
                parentContainer.appendChild(element);
                if (this.__cachedCurrentDomNode && lastOperation === LastOperation.Update) {
                    if (this.__cachedCurrentDomNode.remove) {
                        this.__cachedCurrentDomNode.remove();
                    }
                    else if (this.__cachedCurrentDomNode.parentNode) {
                        this.__cachedCurrentDomNode.parentNode.removeChild(this.__cachedCurrentDomNode);
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

            this.__cachedCurrentDomNode = this.domNode;
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
            if (this.__cachedCurrentDomNode && this.__cachedCurrentDomNode.parentElement) {
                if (this.__cachedCurrentDomNode.remove) {
                    this.__cachedCurrentDomNode.remove();
                }
                else if (this.__cachedCurrentDomNode.parentNode) {
                    this.__cachedCurrentDomNode.parentNode.removeChild(this.__cachedCurrentDomNode);
                }
            }
        }
    }
}
