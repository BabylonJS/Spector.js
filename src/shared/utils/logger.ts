namespace SPECTOR {
    export enum LogLevel {
        noLog = 0,
        error = 1,
        warning = 2,
        info = 3
    }

    export interface ILogger {
        setLevel(level: LogLevel): void;
        error(msg: string, ...restOfMsg: string[]): void;
        warn(msg: string, ...restOfMsg: string[]): void;
        info(msg: string, ...restOfMsg: string[]): void;
    }

    export type LoggerConstructor = {
        new (level?: LogLevel): Utils.ConsoleLogger;
    }
}

namespace SPECTOR.Utils {
    export class ConsoleLogger implements ILogger {

        constructor(private level = LogLevel.warning) { }

        public setLevel(level: LogLevel) {
            this.level = level;
        }

        public error(msg: string, ...restOfMsg: string[]) {
            if (this.level > 0) {
                console.error(msg, restOfMsg);
            }
        }

        public warn(msg: string, ...restOfMsg: string[]) {
            if (this.level > 1) {
                console.warn(msg, restOfMsg);
            }
        }

        public info(msg: string, ...restOfMsg: string[]) {
            if (this.level > 2) {
                console.log(msg, restOfMsg);
            }
        }
    }
}
