export function merge<T, U>(first: T, second: U): T & U {
    const result: any = {};
    for (const id in first) {
        if (first.hasOwnProperty(id)) {
            result[id] = first[id];
        }
    }
    for (const id in second) {
        if (!result.hasOwnProperty(id)) {
            result[id] = second[id];
        }
    }
    return result as T & U;
}
