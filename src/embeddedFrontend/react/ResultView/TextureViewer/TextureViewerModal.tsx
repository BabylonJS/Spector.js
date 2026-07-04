import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../shared/ExternalStore";
import { useResultView } from "../ResultViewContext";
import { ITextureViewerState, IRawImagePixels } from "../../shared/types";
import {
    IChannelMask,
    decodeBase64Pixels,
    applyChannelMask,
    formatHexColor,
    formatNormalized,
} from "../../shared/textureViewer";

/**
 * Full-screen texture viewer modal (#183). Opens for any displayed texture or
 * framebuffer attachment and lets you isolate channels, force the image opaque
 * to reveal RGB hidden behind alpha, sample pixels, change the backdrop, zoom
 * and save. Uses the preserved non-premultiplied pixels when available, falling
 * back to the (premultiplied) thumbnail otherwise.
 */
export function TextureViewerModal() {
    const adapter = useResultView();
    const state = useStore(adapter.store);
    const viewer = state.textureViewer;
    if (!viewer.open) {
        return null;
    }
    return <TextureViewerContent viewer={viewer} onClose={adapter.closeTextureViewer} />;
}

interface ISource {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}

const LOUPE_SIZE = 120;
const LOUPE_TEXELS = 15;

function TextureViewerContent(props: { viewer: ITextureViewerState; onClose: () => void }) {
    const { viewer, onClose } = props;

    const displayRef = useRef<HTMLCanvasElement | null>(null);
    const loupeRef = useRef<HTMLCanvasElement | null>(null);
    const workRef = useRef<HTMLCanvasElement | null>(null);
    const sourceRef = useRef<ISource | null>(null);

    const [mask, setMask] = useState<IChannelMask>({ r: true, g: true, b: true, a: true });
    const [zoom, setZoom] = useState<number>(1);
    const [background, setBackground] = useState<string>("checker");
    const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
    const [pixel, setPixel] = useState<{ x: number; y: number; r: number; g: number; b: number; a: number } | null>(null);
    const [ready, setReady] = useState<boolean>(false);

    // Load the source pixels (raw when available, else decode the thumbnail).
    useEffect(() => {
        let cancelled = false;
        const accept = (source: ISource) => {
            if (cancelled) { return; }
            sourceRef.current = source;
            setDims({ width: source.width, height: source.height });
            setZoom(fitZoom(source.width, source.height));
            setReady(true);
        };

        if (viewer.raw) {
            const decoded = tryDecodeRaw(viewer.raw);
            if (decoded) {
                accept(decoded);
                return () => { cancelled = true; };
            }
            // Corrupt/incompatible raw payload — fall back to the thumbnail below.
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 1;
            canvas.height = img.naturalHeight || 1;
            const ctx = canvas.getContext("2d");
            if (!ctx) { return; }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            accept({ data: new Uint8ClampedArray(imageData.data), width: canvas.width, height: canvas.height });
        };
        img.src = viewer.src;
        return () => { cancelled = true; };
    }, [viewer.src, viewer.raw]);

    // Redraw the display canvas whenever the mask, zoom or source changes.
    useEffect(() => {
        const source = sourceRef.current;
        const display = displayRef.current;
        if (!ready || !source || !display) { return; }

        const work = ensureWorkCanvas(workRef, source.width, source.height);
        const wctx = work.getContext("2d");
        const dctx = display.getContext("2d");
        if (!wctx || !dctx) { return; }

        const processed = applyChannelMask(source.data, mask);
        wctx.putImageData(new ImageData(processed, source.width, source.height), 0, 0);

        display.width = source.width * zoom;
        display.height = source.height * zoom;
        dctx.imageSmoothingEnabled = false;
        dctx.clearRect(0, 0, display.width, display.height);
        dctx.drawImage(work, 0, 0, display.width, display.height);
    }, [mask, zoom, ready]);

    // Close on Escape.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { onClose(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const source = sourceRef.current;
        const display = displayRef.current;
        const loupe = loupeRef.current;
        const work = workRef.current;
        if (!source || !display) { return; }

        const rect = display.getBoundingClientRect();
        const px = Math.floor((e.clientX - rect.left) / zoom);
        const py = Math.floor((e.clientY - rect.top) / zoom);
        if (px < 0 || py < 0 || px >= source.width || py >= source.height) {
            setPixel(null);
            if (loupe) { loupe.style.display = "none"; }
            return;
        }

        const i = (py * source.width + px) * 4;
        setPixel({ x: px, y: py, r: source.data[i], g: source.data[i + 1], b: source.data[i + 2], a: source.data[i + 3] });
        drawLoupe(loupe, work, px, py);
    };

    const handleLeave = () => {
        setPixel(null);
        if (loupeRef.current) { loupeRef.current.style.display = "none"; }
    };

    const handleSave = () => {
        const work = workRef.current;
        if (!work) { return; }
        work.toBlob((blob) => {
            if (!blob) { return; }
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = safeFileName(viewer.label) + ".png";
            anchor.click();
            // Defer revocation so the download is reliably started first.
            setTimeout(() => URL.revokeObjectURL(url), 0);
        });
    };

    const viewportClass = "textureViewerViewport" + (background === "checker" ? " checker" : "");
    const viewportStyle = background === "black" ? { background: "#000" }
        : background === "white" ? { background: "#fff" }
        : undefined;

    return (
        <div className="textureViewerOverlay" onClick={onClose}>
            <div className="textureViewerModal" onClick={(e) => e.stopPropagation()}>
                <div className="textureViewerHeader">
                    <span className="textureViewerTitle">{viewer.label}</span>
                    <span className="textureViewerMeta">
                        {dims ? dims.width + " \u00d7 " + dims.height : ""}
                        {!viewer.raw && dims ? " \u00b7 thumbnail" : ""}
                    </span>
                    <span className="textureViewerClose" title="Close (Esc)" onClick={onClose}>&#x2715;</span>
                </div>

                <div className="textureViewerToolbar">
                    <div className="textureViewerGroup">
                        <span className="lbl">Channels</span>
                        <ChannelButton channel="r" mask={mask} setMask={setMask} />
                        <ChannelButton channel="g" mask={mask} setMask={setMask} />
                        <ChannelButton channel="b" mask={mask} setMask={setMask} />
                        <ChannelButton channel="a" mask={mask} setMask={setMask} />
                    </div>
                    <div className="textureViewerGroup">
                        <span
                            className="tvBtn"
                            title="Force alpha = 1 to reveal RGB hidden behind transparency"
                            onClick={() => setMask({ r: true, g: true, b: true, a: false })}
                        >Opaque</span>
                        <span
                            className="tvBtn"
                            title="Show the alpha channel as grayscale"
                            onClick={() => setMask({ r: false, g: false, b: false, a: true })}
                        >Alpha &#x2192; gray</span>
                    </div>
                    <div className="textureViewerGroup">
                        <span className="lbl">BG</span>
                        <div className="seg">
                            <BgButton value="checker" glyph={"\u25a6"} background={background} setBackground={setBackground} />
                            <BgButton value="black" glyph={"\u25a0"} background={background} setBackground={setBackground} />
                            <BgButton value="white" glyph={"\u25a1"} background={background} setBackground={setBackground} />
                        </div>
                    </div>
                    <div className="textureViewerGroup">
                        <span className="lbl">Zoom</span>
                        <div className="seg">
                            <span className="tvBtn" onClick={() => setZoom((z) => Math.max(1, z / 2))}>&#x2212;</span>
                            <span className="tvBtn" onClick={() => setZoom(dims ? fitZoom(dims.width, dims.height) : 1)}>Fit</span>
                            <span className="tvBtn" onClick={() => setZoom((z) => Math.min(32, z * 2))}>+</span>
                        </div>
                        <span className="zoomVal">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="textureViewerGroup textureViewerGroupEnd">
                        <span className="tvBtn primary" onClick={handleSave}>&#x2b73; Save PNG</span>
                    </div>
                </div>

                <div className="textureViewerBody">
                    <div className={viewportClass} style={viewportStyle}>
                        <canvas
                            ref={displayRef}
                            className="textureViewerCanvas"
                            onMouseMove={handleMove}
                            onMouseLeave={handleLeave}
                        />
                        <canvas ref={loupeRef} className="textureViewerLoupe" width={LOUPE_SIZE} height={LOUPE_SIZE} />
                    </div>
                    <div className="textureViewerRail">
                        <div className="railTitle">Pixel inspector</div>
                        <div className="kv"><span className="k">position</span><span className="v">{pixel ? pixel.x + ", " + pixel.y : "\u2014"}</span></div>
                        <div className="swatch">
                            <div
                                className="swatchInner"
                                style={pixel ? { background: "rgba(" + pixel.r + "," + pixel.g + "," + pixel.b + "," + (pixel.a / 255) + ")" } : undefined}
                            />
                        </div>
                        <div className="kv"><span className="k">R</span><span className="v">{pixel ? pixel.r : "\u2014"}</span></div>
                        <div className="kv"><span className="k">G</span><span className="v">{pixel ? pixel.g : "\u2014"}</span></div>
                        <div className="kv"><span className="k">B</span><span className="v">{pixel ? pixel.b : "\u2014"}</span></div>
                        <div className="kv"><span className="k">A</span><span className="v">{pixel ? pixel.a : "\u2014"}</span></div>
                        <div className="kv"><span className="k">hex</span><span className="v">{pixel ? formatHexColor(pixel.r, pixel.g, pixel.b, pixel.a) : "\u2014"}</span></div>
                        <div className="kv"><span className="k">norm</span><span className="v">{pixel ? formatNormalized(pixel.r, pixel.g, pixel.b, pixel.a) : "\u2014"}</span></div>
                        <div className="hint">
                            Move over the texture to sample pixels. Toggle channels to isolate RGB / alpha.
                            <b> Opaque</b> reveals colour hidden behind transparency (#183).
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChannelButton(props: { channel: keyof IChannelMask; mask: IChannelMask; setMask: (m: IChannelMask) => void }) {
    const { channel, mask, setMask } = props;
    const on = mask[channel];
    const className = "channel " + channel + (on ? " on" : "");
    return (
        <span className={className} onClick={() => setMask({ ...mask, [channel]: !on })}>
            {channel.toUpperCase()}
        </span>
    );
}

function BgButton(props: { value: string; glyph: string; background: string; setBackground: (v: string) => void }) {
    const { value, glyph, background, setBackground } = props;
    return (
        <span
            className={"tvBtn" + (background === value ? " active" : "")}
            onClick={() => setBackground(value)}
        >{glyph}</span>
    );
}

/** Decode and validate a raw pixel payload; returns null on any inconsistency. */
function tryDecodeRaw(raw: IRawImagePixels): ISource | null {
    try {
        if (!raw.data || raw.width <= 0 || raw.height <= 0) {
            return null;
        }
        const data = decodeBase64Pixels(raw.data);
        if (data.length !== raw.width * raw.height * 4) {
            return null;
        }
        return { data, width: raw.width, height: raw.height };
    } catch (e) {
        return null;
    }
}

/** Zoom that fits the source into a comfortable default viewport size. */
function fitZoom(width: number, height: number): number {
    const target = 480;
    return Math.max(1, Math.min(16, Math.floor(target / Math.max(width, height)) || 1));
}

/** Lazily create/resize the offscreen work canvas that holds the processed image. */
function ensureWorkCanvas(ref: React.MutableRefObject<HTMLCanvasElement | null>, width: number, height: number): HTMLCanvasElement {
    let canvas = ref.current;
    if (!canvas) {
        canvas = document.createElement("canvas");
        ref.current = canvas;
    }
    if (canvas.width !== width) { canvas.width = width; }
    if (canvas.height !== height) { canvas.height = height; }
    return canvas;
}

/** Render the magnifier around the hovered texel. */
function drawLoupe(loupe: HTMLCanvasElement | null, work: HTMLCanvasElement | null, px: number, py: number): void {
    if (!loupe || !work) { return; }
    const ctx = loupe.getContext("2d");
    if (!ctx) { return; }
    const half = LOUPE_TEXELS >> 1;
    const cell = LOUPE_SIZE / LOUPE_TEXELS;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.drawImage(work, px - half, py - half, LOUPE_TEXELS, LOUPE_TEXELS, 0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.strokeStyle = "#F0640D";
    ctx.lineWidth = 2;
    ctx.strokeRect(half * cell, half * cell, cell, cell);
    loupe.style.display = "block";
}

/** Sanitize a texture label into a safe file name for the Save action. */
function safeFileName(label: string): string {
    const cleaned = (label || "texture").replace(/[^a-z0-9_\-]+/gi, "_").replace(/^_+|_+$/g, "");
    return cleaned || "texture";
}
