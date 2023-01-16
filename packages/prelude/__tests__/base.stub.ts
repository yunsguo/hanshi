import { partialApply } from '../lib/base';

function add(a: number, b: number, c: number, d: number) {
    return a + b + c + d;
}

describe('lib/prelude', () => {
    describe('partialApply', () => {
        it('should bind a function and change its signature', () => {
            const ba1 = partialApply(add, 1);

            const ba2 = partialApply(ba1, 2);

            const ba3 = partialApply(ba2, 3);

            const ba4 = partialApply(ba3, 4);

            expect(ba1(1, 2, 3)).toBe(7);
            expect(ba2(4, 5)).toBe(12);
            expect(ba3(6)).toBe(12);
            expect(ba4).toBe(10);
        });
    });
});
