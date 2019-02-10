export class Observable<T> {
    private callbacks: { [id: number]: (element: T) => void } = [];
    private counter = -1;

    public add(callback: (element: T) => void, context?: any): number {
        this.counter++;

        if (context) {
            callback = callback.bind(context);
        }
        this.callbacks[this.counter] = callback;

        return this.counter;
    }

    public remove(id: number): void {
        delete this.callbacks[id];
    }

    public clear(): void {
        this.callbacks = {};
    }

    public trigger(value: T): void {
        for (const key in this.callbacks) {
            if (this.callbacks.hasOwnProperty(key)) {
                this.callbacks[key](value);
            }
        }
    }
}
