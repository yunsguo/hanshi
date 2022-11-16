import { Just, maybe, nothing } from '../lib/maybe';

describe('lib/maybe', () => {
    describe('maybe', () => {
        it('should have static polymorphic behavior', () => {
            expect(maybe(5, (x) => x + 1, Just.of(10))).toBe(11);
            expect(maybe(5, (x) => x + 1, nothing)).toBe(5);
        });
    });
});
