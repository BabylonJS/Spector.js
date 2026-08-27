import { BaseCommand } from "./baseCommand";
import { ICommandCapture } from "../../shared/capture/commandCapture";
import { IContextInformation } from "../types/contextInformation";
import { ReadProgramHelper } from "../utils/readProgramHelper";

/** Captures both shader sources and linker diagnostics after program linking. */
export class LinkProgram extends BaseCommand {
    public static readonly commandName = "linkProgram";

    protected get spiedCommandName(): string {
        return LinkProgram.commandName;
    }

    constructor(options: IContextInformation) {
        super(options);
    }

    protected transformCapture(commandCapture: ICommandCapture): void {
        const program = commandCapture.commandArguments[0] as WebGLProgram;
        if (!program) {
            return;
        }

        const toggleCapture = this.options.toggleCapture;
        if (toggleCapture) {
            toggleCapture(false);
        }

        try {
            commandCapture.program = ReadProgramHelper.getProgramData(this.options.context, program);
        }
        finally {
            if (toggleCapture) {
                toggleCapture(true);
            }
        }

        const status = commandCapture.program.programStatus.LINK_STATUS ? "linked" : "failed";
        commandCapture.text = `${this.spiedCommandName}: ${this.stringifyValue(program)} -> ${status}`;
    }
}
