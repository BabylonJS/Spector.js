import { Compositor } from "./compositor";
import { StateStore } from "./stateStore";
import { BaseNoneGenericComponent } from "./baseComponent";
import { ComponentInstance } from "./componentInstance";

export class MVX {
    private static readonly REFRESHRATEINMILLISECONDS = 100;

    private readonly compositor: Compositor;
    private readonly stateStore: StateStore;

    private willRender: boolean;
    private rootStateId: number;

    constructor(placeHolder: Element) {
        this.stateStore = new StateStore();
        this.compositor = new Compositor(placeHolder, this.stateStore);

        this.willRender = false;
        this.rootStateId = -1;
    }

    public addRootState(data: {}, component: BaseNoneGenericComponent, immediate = false): number {
        const componentInstance = new ComponentInstance(component);
        const stateId = this.stateStore.add(data, componentInstance);
        this.rootStateId = stateId;
        this.setForRender(immediate);
        return stateId;
    }

    public addChildState(parentId: number, data: {}, component: BaseNoneGenericComponent, immediate = false): number {
        const id = this.insertChildState(parentId, data, Number.MAX_VALUE, component);
        this.setForRender(immediate);
        return id;
    }

    public insertChildState(parentId: number, data: {}, index: number,
        component: BaseNoneGenericComponent, immediate = false): number {
        const componentInstance = new ComponentInstance(component);
        const id = this.stateStore.insertChildAt(parentId, index, data, componentInstance);
        this.setForRender(immediate);
        return id;
    }

    public updateState(id: number, data: {}, immediate = false): void {
        this.stateStore.update(id, data);
        this.setForRender(immediate);
    }

    public removeState(id: number, immediate = false): void {
        this.stateStore.remove(id);
        this.setForRender(immediate);
    }

    public removeChildrenStates(id: number, immediate = false): void {
        this.stateStore.removeChildren(id);
        this.setForRender(immediate);
    }

    public getState(id: number): {} {
        return this.stateStore.getData(id);
    }
    public getGenericState<T>(id: number): T {
        return this.getState(id) as T;
    }

    public getChildrenState(id: number): any[] {
        return this.stateStore.getChildrenIds(id).map(
            (childId) => this.stateStore.getData(id),
        );
    }
    public getChildrenGenericState<T>(id: number): T[] {
        return this.getChildrenState(id) as T[];
    }

    public hasChildren(id: number): boolean {
        return this.stateStore.hasChildren(id);
    }

    public updateAllChildrenState(id: number, updateCallback: (state: any) => any): void {
        const childrenIds = this.stateStore.getChildrenIds(id);
        for (const childId of childrenIds) {
            const state = this.getGenericState(childId);
            updateCallback(state);
            this.updateState(childId, state);
        }
    }

    public updateAllChildrenGenericState<T>(id: number, updateCallback: (state: T) => T): void {
        this.updateAllChildrenState(id, updateCallback);
    }

    private setForRender(immediate: boolean) {
        if (!this.willRender) {
            this.willRender = true;
            if (immediate) {
                this.compose();
            }
            else {
                setTimeout(this.compose.bind(this), MVX.REFRESHRATEINMILLISECONDS);
            }
        }
    }

    private compose(): void {
        // Render once.
        this.willRender = false;

        // Render and compose.
        this.compositor.compose(this.rootStateId);

        // Clean up the pending list of processed states.
        this.stateStore.flushPendingOperations();
    }
}
