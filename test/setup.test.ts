describe('Test infrastructure', () => {
    it('jest is configured correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('jsdom provides document', () => {
        expect(typeof document).toBe('object');
        expect(typeof document.createElement).toBe('function');
    });

    it('jsdom provides HTMLCanvasElement', () => {
        expect(typeof HTMLCanvasElement).toBe('function');
        const canvas = document.createElement('canvas');
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });
});
