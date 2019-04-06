export class StackTrace {
    public static getStackTrace(removeFirstNCalls = 0, removeLastNCalls = 0): string[] {
        const callstack: string[] = [];

        try {
            throw new Error("Errorator.");
        } catch (err) {
            if (err.stack) {
                const lines = err.stack.split("\n");
                for (let i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                        callstack.push(lines[i]);
                    }
                    else if (lines[i].indexOf("    at ") === 0) {
                        lines[i] = lines[i].replace("    at ", "");
                        callstack.push(lines[i]);
                    }
                    else if (lines[i].indexOf("/<@http") !== -1) {
                        lines[i] = lines[i].substring(lines[i].indexOf("/<@http") + 3);
                        callstack.push(lines[i]);
                    }
                    else if (lines[i].indexOf("@http") !== -1) {
                        lines[i] = lines[i].replace("@http", " (http");
                        lines[i] = lines[i] + ")";
                        callstack.push(lines[i]);
                    }
                }
            }
            else if (err.message) {
                const lines = err.message.split("\n");
                for (let i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                        let entry = lines[i];
                        // Append next line also since it has the file info
                        if (lines[i + 1]) {
                            entry += " at " + lines[i + 1];
                            i++;
                        }
                        callstack.push(entry);
                    }
                }
            }
        }

        if (!callstack) {
            // tslint:disable-next-line:no-arg
            let currentFunction = arguments.callee.caller;
            while (currentFunction) {
                const fn = currentFunction.toString();
                const fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf("")) || "anonymous";
                callstack.push(fname);
                currentFunction = currentFunction.caller;
            }
        }

        // Remove this call and Spy.
        if (callstack) {
            callstack.shift();
            for (let i = 0; i < removeFirstNCalls; i++) {
                if (callstack.length > 0) {
                    callstack.shift();
                }
                else {
                    break;
                }
            }
            for (let i = 0; i < removeLastNCalls; i++) {
                if (callstack.length > 0) {
                    callstack.pop();
                }
                else {
                    break;
                }
            }
        }

        return callstack;
    }
}
