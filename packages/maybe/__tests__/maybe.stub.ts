import { _ } from '@hanshi/prelude';
import { Just, Nothing, fmap, maybe, nothing } from '../lib/maybe';

describe('lib/maybe', () => {
    describe('maybe', () => {
        it('should have static polymorphic behavior', () => {
            expect(maybe(5, (x) => x + 1, Just.of(10))).toBe(11);
            expect(maybe<number, number>(5, (x) => x + 1, nothing)).toBe(5);
        });
    });
    describe('Nothing/Just', () => {
        it('should have proper instanceof behavior', () => {
            expect(nothing instanceof Nothing).toBe(true);
            expect(Just.of(5) instanceof Nothing).toBe(false);
            expect(nothing instanceof maybe).toBe(false);
            expect(Just.of(5) instanceof Just).toBe(true);
        });
    });
    function add(a: number, b: number) {
        return a + b;
    }
    describe('traits', () => {
        it('should have proper typeclass behavior', () => {
            expect(fmap(_(add, 1), Just.of(2))).toStrictEqual(Just.of(3));
        });
    });
});
