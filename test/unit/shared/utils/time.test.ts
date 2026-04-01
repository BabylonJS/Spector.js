import { Time } from "../../../../src/shared/utils/time";

describe('Time', () => {
    it('Time.now returns a number', () => {
        const now = Time.now;
        expect(typeof now).toBe('number');
        expect(now).toBeGreaterThanOrEqual(0);
    });

    it('Time.now returns increasing values', () => {
        const t1 = Time.now;
        const t2 = Time.now;
        expect(t2).toBeGreaterThanOrEqual(t1);
    });
});
