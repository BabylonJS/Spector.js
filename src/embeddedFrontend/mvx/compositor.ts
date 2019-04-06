import { StateStore, LastOperation } from "./stateStore";

export class Compositor {
    private readonly placeHolder: Element;
    private readonly stateStore: StateStore;

    constructor(placeHolder: Element, stateStore: StateStore) {
        this.placeHolder = placeHolder;
        this.stateStore = stateStore;
    }

    public compose(rootStateId: number) {
        // First pass to render each dirty node.
        const dirtyStates = this.stateStore.getStatesToProcess();
        let render = false;
        for (const dirtyStateKey in dirtyStates) {
            if (dirtyStates.hasOwnProperty(dirtyStateKey)) {
                const dirtyStateId = dirtyStates[dirtyStateKey];
                const lastOperationForDirtyState = this.stateStore.getLastOperation(dirtyStateId);
                const componentInstance = this.stateStore.getComponentInstance(dirtyStateId);
                const state = this.stateStore.getData(dirtyStateId);
                componentInstance.render(state, dirtyStateId, lastOperationForDirtyState);
                render = true;
            }
        }

        // early exist if nothing was touched.
        if (!render) {
            return;
        }

        // Recursively apply the new rendered nodes to the dom.
        const lastOperation = this.stateStore.getLastOperation(rootStateId);
        this.composeInContainer(this.placeHolder, Number.MAX_VALUE, rootStateId, lastOperation);
    }

    private composeChildren(stateId: number, container: Element): void {
        if (!container) {
            return;
        }

        const children = this.stateStore.getChildrenIds(stateId);
        let currentChildIndexInDom = 0;
        for (let i = 0; i < children.length; i++) {
            const childId = children[i];
            const lastOperation = this.stateStore.getLastOperation(childId);

            // Recurse.
            this.composeInContainer(container, currentChildIndexInDom, childId, lastOperation);

            // Reindex in case of deleted nodes.
            if (lastOperation !== LastOperation.Delete) {
                currentChildIndexInDom++;
            }
        }
    }

    private composeInContainer(parentContainer: Element, indexInContainer: number, stateId: number, lastOperation: LastOperation): void {
        const componentInstance = this.stateStore.getComponentInstance(stateId);
        const childrenContainer = componentInstance.composeInContainer(parentContainer, indexInContainer, lastOperation);

        // Recursion path.
        this.composeChildren(stateId, childrenContainer);
    }
}
