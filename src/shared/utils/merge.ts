namespace SPECTOR {
    export function merge<T, U>(first: T, second: U): T & U {
        let result: any = {};
        for (let id in first) {
            result[id] = first[id];
        }
        for (let id in second) {
            if (!result.hasOwnProperty(id)) {
                result[id] = second[id];
            }
        }
        return <T & U>result;
    }
}
