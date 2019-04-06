export enum LogLevel {
    noLog = 0,
    error = 1,
    warning = 2,
    info = 3,
}

export class Logger {
    public static level = LogLevel.warning;

    public static error(msg: string, ...restOfMsg: string[]) {
        if (this.level > 0) {
            // tslint:disable-next-line:no-console
            console.error(msg, restOfMsg);
        }
    }

    public static warn(msg: string, ...restOfMsg: string[]) {
        if (this.level > 1) {
            // tslint:disable-next-line:no-console
            console.warn(msg, restOfMsg);
        }
    }

    public static info(msg: string, ...restOfMsg: string[]) {
        if (this.level > 2) {
            // tslint:disable-next-line:no-console
            console.log(msg, restOfMsg);
        }
    }
}
