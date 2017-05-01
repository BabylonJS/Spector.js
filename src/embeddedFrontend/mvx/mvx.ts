namespace SPECTOR.EmbeddedFrontend {

    export class MVX {
        private static readonly REFRESHRATEINMILLISECONDS = 100;

        private readonly compositor: Compositor;
        private readonly stateStore: StateStore;

        private willRender: boolean;
        private rootStateId: number;

        constructor(placeHolder: Element, private readonly logger: ILogger) {
            this.stateStore = new StateStore(logger);
            this.compositor = new Compositor(placeHolder, this.stateStore, logger);

            this.willRender = false;
            this.rootStateId = -1;
        }

        public addRootState(data: {}, component: BaseNoneGenericComponent): number {
            this.setForRender();
            const componentInstance = new ComponentInstance(component, this.logger);
            const stateId = this.stateStore.add(data, componentInstance);
            this.rootStateId = stateId;
            return stateId;
        }

        public addChildState(parentId: number, data: {}, component: BaseNoneGenericComponent): number {
            this.setForRender();
            return this.insertChildState(parentId, data, Number.MAX_VALUE, component);
        }

        public insertChildState(parentId: number, data: {}, index: number, component: BaseNoneGenericComponent): number {
            this.setForRender();
            const componentInstance = new ComponentInstance(component, this.logger);
            return this.stateStore.insertChildAt(parentId, index, data, componentInstance);
        }

        public updateState(id: number, data: {}): void {
            this.setForRender();
            this.stateStore.update(id, data);
        }

        public removeState(id: number): void {
            this.setForRender();
            this.stateStore.remove(id);
        }

        public removeChildrenStates(id: number): void {
            this.setForRender();
            this.stateStore.removeChildren(id);
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

        private setForRender() {
            if (!this.willRender) {
                this.willRender = true;
                setTimeout(this.compose.bind(this), MVX.REFRESHRATEINMILLISECONDS);
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
}
