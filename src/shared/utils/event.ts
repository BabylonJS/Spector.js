namespace SPECTOR {
    export interface IEvent<T> {
        add(callback: (element: T) => void, context?: any): number;
        remove(id: number): void;
        clear(): void;
        trigger(value: T): void;
    }

    export type EventConstructor = {
        new<T>(): IEvent<T>
    }
}

namespace SPECTOR.Utils {
    export class Event<T> {
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
                this.callbacks[key](value);
            }
        }
    }
}
