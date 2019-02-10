import { ComponentInstance } from "./componentInstance";

interface IState {
    readonly id: number;
    readonly data: {};
    parent: IState;
    children: IState[];
    componentInstance: ComponentInstance;
    lastOperation: LastOperation;
}

export const enum LastOperation {
    Processed = 0,
    Add = 20,
    Update = 40,
    Delete = 50,
}

export class StateStore {
    private readonly store: { [key: number]: IState };
    private pendingOperation: { [key: number]: number };

    private idGenerator: number;

    constructor() {
        this.store = {};
        this.idGenerator = 0;
        this.pendingOperation = {};
    }

    public getLastOperation(id: number): LastOperation {
        return this.store[id].lastOperation;
    }

    public getData(id: number): {} {
        return this.store[id].data;
    }

    public getComponentInstance(id: number): ComponentInstance {
        return this.store[id].componentInstance;
    }

    public getParentId(id: number): number {
        if (this.store[id].parent) {
            return this.store[id].parent.id;
        }
        return -1;
    }

    public getChildrenIds(id: number): number[] {
        const result: number[] = [];
        for (const child of this.store[id].children) {
            result.push(child.id);
        }
        return result;
    }

    public hasChildren(id: number): boolean {
        return this.store[id].children.length > 0;
    }

    public add(data: {}, componentInstance: ComponentInstance): number {
        const id = this.getNewId();
        this.pendingOperation[id] = id;
        this.store[id] = {
            data,
            id,
            parent: null,
            children: [],
            componentInstance,
            lastOperation: LastOperation.Add,
        };
        return id;
    }

    public update(id: number, data: {}): void {
        const currentState = this.store[id];
        this.pendingOperation[id] = id;
        // Update the state to not lose references.
        (this.store[id] as any).data = data;
        this.store[id].lastOperation = LastOperation.Update;
    }

    public addChild(parentId: number, data: {}, componentInstance: ComponentInstance): number {
        const parent = this.store[parentId];
        const id = this.add(data, componentInstance);
        this.pendingOperation[id] = id;
        const child = this.store[id];
        child.parent = parent;
        parent.children.push(child);
        return id;
    }

    public insertChildAt(parentId: number, index: number, data: {}, componentInstance: ComponentInstance): number {
        const parent = this.store[parentId];
        const id = this.add(data, componentInstance);
        this.pendingOperation[id] = id;
        const child = this.store[id];
        child.parent = parent;

        if (index >= parent.children.length) {
            parent.children.push(child);
        }
        else if (index >= 0) {
            parent.children.splice(index, 0, child);
        }
        else {
            parent.children.unshift(child);
        }
        return id;
    }

    public removeChildById(parentId: number, id: number): void {
        const parent = this.store[parentId];
        for (let i = parent.children.length - 1; i >= 0; i--) {
            const state = parent.children[i];
            if (state.id === id) {
                this.removeChildAt(parentId, i);
                break;
            }
        }
    }

    public removeChildAt(parentId: number, index: number): void {
        const parent = this.store[parentId];
        let child: IState;
        if (index > (parent.children.length - 1)) {
            child = parent.children[parent.children.length - 1];
            parent.children[parent.children.length - 1].parent = null;
            parent.children.splice(parent.children.length - 1, 1);
        }
        else if (index >= 0) {
            child = parent.children[index];
            parent.children[index].parent = null;
            parent.children.splice(index, 1);
        }
        else {
            child = parent.children[0];
            parent.children[0].parent = null;
            parent.children.splice(0, 1);
        }
        child.parent = null;
        this.remove(child.id);
    }

    public remove(id: number): void {
        const child = this.store[id];
        if (child.parent) {
            const parent = this.store[child.parent.id];
            this.removeChildById(child.parent.id, id);
        }
        else {
            this.removeChildren(id);
            this.store[id].lastOperation = LastOperation.Delete;
            this.pendingOperation[id] = id;
        }
    }

    public removeChildren(id: number) {
        const state = this.store[id];
        while (state.children.length) {
            this.remove(state.children[0].id);
        }
    }

    public getStatesToProcess(): { [key: number]: number } {
        return this.pendingOperation;
    }

    public flushPendingOperations() {
        for (const id in this.pendingOperation) {
            if (this.pendingOperation[id]) {
                if (this.store[id].lastOperation === LastOperation.Delete) {
                    delete this.store[id];
                }
                else {
                    this.store[id].lastOperation = LastOperation.Processed;
                }
            }
        }
        this.pendingOperation = {};
    }

    private getNewId(): number {
        return ++this.idGenerator;
    }
}
