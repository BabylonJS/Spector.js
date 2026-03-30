import React, { useCallback, useRef } from "react";
import { ICapture } from "../../../../shared/capture/capture";
import { Logger } from "../../../../shared/utils/logger";
import { CaptureListItem } from "./CaptureListItem";

/**
 * Capture list with drag-and-drop zone.
 * Original: src/embeddedFrontend/resultView/captureList/captureListComponent.ts
 *
 * DOM:
 * <div class="captureListComponent [active?]">
 *   <div class="openCaptureFile"><span>Drag files here to open...</span></div>
 *   <ul>...</ul>
 * </div>
 */
export interface CaptureListProps {
    active: boolean;
    captures: ReadonlyArray<{ capture: ICapture; active: boolean }>;
    onCaptureSelected: (index: number) => void;
    onSaveRequested: (capture: ICapture) => void;
    onCaptureLoaded: (capture: ICapture) => void;
}

export function CaptureList({ active, captures, onCaptureSelected, onSaveRequested, onCaptureLoaded }: CaptureListProps) {
    const dropRef = useRef<HTMLDivElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        e.preventDefault();
        loadFiles(e.nativeEvent, onCaptureLoaded);
    }, [onCaptureLoaded]);

    return (
        <div className={`captureListComponent ${active ? "active" : ""}`}>
            <div
                className="openCaptureFile"
                ref={dropRef}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <span>Drag files here to open a previously saved capture.</span>
            </div>
            <ul>
                {captures.map((entry, i) => (
                    <CaptureListItem
                        key={i}
                        capture={entry.capture}
                        active={entry.active}
                        onCaptureSelected={() => onCaptureSelected(i)}
                        onSaveRequested={() => onSaveRequested(entry.capture)}
                    />
                ))}
            </ul>
        </div>
    );
}

function loadFiles(event: DragEvent, onCaptureLoaded: (capture: ICapture) => void): void {
    let filesToLoad: FileList | null = null;

    if (event && event.dataTransfer && event.dataTransfer.files) {
        filesToLoad = event.dataTransfer.files;
    }

    if (event && event.target && (event as any).target.files) {
        filesToLoad = (event as any).target.files;
    }

    if (filesToLoad && filesToLoad.length > 0) {
        for (let i = 0; i < filesToLoad.length; i++) {
            const name = filesToLoad[i].name.toLowerCase();
            const extension = name.split(".").pop();

            if (extension === "json") {
                const fileToLoad = filesToLoad[i];
                const reader = new FileReader();
                reader.onerror = (e) => {
                    Logger.error("Error while reading file: " + fileToLoad.name + e);
                };
                reader.onload = (e) => {
                    try {
                        const capture = JSON.parse((e as any).target["result"]);
                        onCaptureLoaded(capture);
                    } catch (exception) {
                        Logger.error("Error while reading file: " + fileToLoad.name + exception);
                    }
                };
                reader.readAsText(fileToLoad);
            }
        }
    }
}
