import { useSyncExternalStore } from "react";

/**
 * Lightweight external store for bridging imperative API calls to React state.
 * Adapter classes call setState()/setSnapshot(); React components subscribe via useStore().
 *
 * Design notes:
 * - getSnapshot and subscribe are arrow functions (bound at construction) because
 *   React's useSyncExternalStore calls them without `this` context.
 * - setState takes an updater function to enable safe derived-state transitions.
 * - _listeners is a Set for O(1) add/delete — no linear scan on unsubscribe.
 * - No defensive copy in getSnapshot: callers must produce new references in setState
 *   to trigger re-renders (standard React immutability contract).
 */
export class ExternalStore<T> {
    private _state: T;
    private readonly _listeners: Set<() => void> = new Set();

    constructor(initialState: T) {
        this._state = initialState;
    }

    /** Called by React internally via useSyncExternalStore. */
    public getSnapshot = (): T => {
        return this._state;
    }

    /** Subscribe to state changes. Returns unsubscribe function. */
    public subscribe = (listener: () => void): (() => void) => {
        this._listeners.add(listener);
        return () => { this._listeners.delete(listener); };
    }

    /** Update state via updater function. Must return a new reference to trigger re-render. */
    public setState(updater: (prev: T) => T): void {
        this._state = updater(this._state);
        this._emitChange();
    }

    /** Replace state entirely. */
    public setSnapshot(state: T): void {
        this._state = state;
        this._emitChange();
    }

    private _emitChange(): void {
        for (const listener of this._listeners) {
            listener();
        }
    }
}

/**
 * React hook to subscribe to an ExternalStore.
 * Components using this hook will re-render when setState/setSnapshot is called.
 */
export function useStore<T>(store: ExternalStore<T>): T {
    return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
