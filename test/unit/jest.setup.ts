// Save and restore prototype state to prevent test pollution
const originalHTMLCanvasGetContext = typeof HTMLCanvasElement !== 'undefined'
    ? HTMLCanvasElement.prototype.getContext
    : undefined;

afterEach(() => {
    // Restore canvas prototype after each test
    if (typeof HTMLCanvasElement !== 'undefined' && originalHTMLCanvasGetContext) {
        HTMLCanvasElement.prototype.getContext = originalHTMLCanvasGetContext;
    }
});
