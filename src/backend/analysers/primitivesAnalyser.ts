import { BaseAnalyser } from "./baseAnalyser";
import { ICapture } from "../../shared/capture/capture";
import { IAnalysis } from "../../shared/capture/analysis";
import { WebGlConstants } from "../types/webglConstants";

interface IPrimitivesCount {
    total: number;
    totalTriangles: number;
    totalTriangleStrip: number;
    totalTriangleFan: number;
    totalLines: number;
    totalLineStrip: number;
    totalLineLoop: number;
    totalPoints: number;
}

export class PrimitivesAnalyser extends BaseAnalyser {
    public static readonly analyserName = "Primitives";

    protected get analyserName(): string {
        return PrimitivesAnalyser.analyserName;
    }

    protected appendToAnalysis(capture: ICapture, analysis: IAnalysis): void {
        if (!capture.commands) {
            return;
        }

        const primitives = {
            total: 0,
            totalTriangles: 0,
            totalTriangleStrip: 0,
            totalTriangleFan: 0,
            totalLines: 0,
            totalLineStrip: 0,
            totalLineLoop: 0,
            totalPoints: 0,
        };

        for (const command of capture.commands) {
            if (command.name === "drawArrays" && command.commandArguments.length >= 3) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
            }
            else if (command.name === "drawArraysInstanced" && command.commandArguments.length >= 3) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
            }
            else if (command.name === "drawArraysInstancedANGLE" && command.commandArguments.length >= 3) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
            }
            else if (command.name === "drawElements" && command.commandArguments.length >= 2) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
            }
            else if (command.name === "drawElementsInstanced" && command.commandArguments.length >= 2) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
            }
            else if (command.name === "drawElementsInstancedANGLE" && command.commandArguments.length >= 2) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
            }
            else if (command.name === "drawRangeElements" && command.commandArguments.length >= 4) {
                this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[3]);
            }
        }

        analysis["total"] = primitives.total;
        analysis["triangles"] = primitives.totalTriangles;
        analysis["triangleStrip"] = primitives.totalTriangleStrip;
        analysis["triangleFan"] = primitives.totalTriangleFan;
        analysis["lines"] = primitives.totalLines;
        analysis["lineStrip"] = primitives.totalLineStrip;
        analysis["lineLoop"] = primitives.totalLineLoop;
        analysis["points"] = primitives.totalPoints;
    }

    private appendToPrimitives(primitives: IPrimitivesCount, mode: number, count: number): void {
        if (mode === WebGlConstants.POINTS.value) {
            primitives.totalPoints += count;
        }
        else if (mode === WebGlConstants.LINES.value) {
            primitives.totalLines += count;
        }
        else if (mode === WebGlConstants.LINE_STRIP.value) {
            primitives.totalLineStrip += count;
        }
        else if (mode === WebGlConstants.LINE_LOOP.value) {
            primitives.totalLineLoop += count;
        }
        else if (mode === WebGlConstants.TRIANGLES.value) {
            primitives.totalTriangles += count;
        }
        else if (mode === WebGlConstants.TRIANGLE_STRIP.value) {
            primitives.totalTriangleStrip += count;
        }
        else if (mode === WebGlConstants.TRIANGLE_FAN.value) {
            primitives.totalTriangleFan += count;
        }

        primitives.total += count;
    }
}
