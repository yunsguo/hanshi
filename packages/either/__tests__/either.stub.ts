import { fmap, id, replace } from '@hanshi/prelude';
import { Left, Right, either, functor } from '../lib/either';

describe('lib/either', () => {
    describe('either', () => {
        it('should have static polymorphic behavior', () => {
            expect(either(id, (x) => x + 1, Left.of(1))).toBe(1);
            expect(either(id, (x) => x + 1, Right.of(1))).toBe(2);
        });
    });
    describe('functor', () => {
        it('should have fmap implementation', () => {
            const errLeft = Left.of(new Error('test error'));
            expect(functor[fmap]((a, b) => a + b, errLeft)).toBe(errLeft);
            expect(functor[fmap]((a) => a + 5, Right.of(5))).toStrictEqual(
                Right.of(10)
            );
        });
        it('should have replace implementation', () => {
            const errLeft = Left.of(new Error('test error'));
            const numberRight = Right.of(5);
            expect(functor[replace](10, errLeft)).toStrictEqual(Right.of(10));
            expect(functor[replace](5, numberRight)).toStrictEqual(Right.of(5));
        });
    });
});
