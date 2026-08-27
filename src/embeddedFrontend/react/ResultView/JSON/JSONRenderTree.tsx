import React from "react";
import { JSONRenderItem } from "../../shared/types";
import { JSONGroup } from "./JSONGroup";
import { JSONItem } from "./JSONItem";
import { JSONImageItem } from "./JSONImageItem";
import { JSONHelpItem } from "./JSONHelpItem";
import { JSONVisualStateItem } from "./JSONVisualStateItem";
import { JSONShaderSourceItem } from "./JSONShaderSourceItem";
import { IShaderCapture } from "../../../../shared/capture/programCapture";

/**
 * Recursively renders a JSONRenderItem[] tree.
 * This bridges the pure data structures built by the adapter
 * into the React component tree that matches the original MVX DOM.
 */
export interface JSONRenderTreeProps {
    items: JSONRenderItem[];
    onShaderSourceOpen?: (shader: IShaderCapture, programLog?: string) => void;
}

export function JSONRenderTree({ items, onShaderSourceOpen }: JSONRenderTreeProps) {
    if (!items || items.length === 0) { return null; }

    return (
        <>
            {items.map((item, i) => {
                switch (item.type) {
                    case "group":
                        return (
                            <JSONGroup key={i} title={item.title}>
                                <JSONRenderTree items={item.children} onShaderSourceOpen={onShaderSourceOpen} />
                            </JSONGroup>
                        );
                    case "item":
                        return <JSONItem key={i} itemKey={item.key} value={item.value} />;
                    case "image":
                        return <JSONImageItem key={i} itemKey={item.key} value={item.value} pixelated={item.pixelated} raw={item.raw} />;
                    case "help":
                        return <JSONHelpItem key={i} itemKey={item.key} value={item.value} help={item.help} />;
                    case "shaderSource":
                        return (
                            <JSONShaderSourceItem
                                key={i}
                                itemKey={item.key}
                                shader={item.shader}
                                programLog={item.programLog}
                                onOpen={onShaderSourceOpen}
                            />
                        );
                    case "visualState":
                        return <JSONVisualStateItem key={i} visualState={item.visualState} />;
                    default:
                        return null;
                }
            })}
        </>
    );
}
