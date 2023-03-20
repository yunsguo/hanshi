import { id } from '@hanshi/prelude';
import { defineLiftAN, defineReplace } from '@hanshi/typeclass';
import {
    Just,
    Nothing,
    fmap,
    insert,
    liftAN,
    maybe,
    nothing,
    pure,
    sequenceA,
    tie,
    v$,
    warp
} from '../lib';

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
    describe('typeclass implementation', () => {
        const inc = (a: number) => a + 1;
        const dec = (a: number) => a - 1;
        const comp = (a: number) => dec(inc(a));
        describe('decayable', () => {
            it('should return with mapped value', () => {
                const r = Math.random();

                expect(Just.of(r).dmap(id)).toBe(r);
                expect(Just.of(r).dmap((a) => a + 1)).toBe(r + 1);
            });
        });
        describe('fmap', () => {
            it('should return with correct value', () => {
                expect(fmap(inc, Just.of(1))).toStrictEqual(Just.of(2));
                expect(fmap(inc, nothing)).toStrictEqual(nothing);
            });
            it('should follow fmap restrictions', () => {
                expect(fmap(id, Just.of(5))).toStrictEqual(id(Just.of(5)));
                expect(fmap(id, nothing)).toEqual(id(nothing));
                expect(fmap(comp, Just.of(3))).toStrictEqual(
                    fmap(dec, fmap(inc, Just.of(3)))
                );
                expect(fmap(comp, nothing)).toStrictEqual(
                    fmap(dec, fmap(inc, nothing))
                );
            });
        });
        describe('<$', () => {
            it('should return with correct value', () => {
                const v$2 = defineReplace(fmap);
                expect(v$(5, Just.of(1))).toStrictEqual(v$2(5, Just.of(1)));
                expect(v$(4, nothing)).toStrictEqual(v$2(4, nothing));
            });
        });
        const add = (a: number, b: number) => a + b;
        describe('tie', () => {
            it('should return with correct value', () => {
                expect(tie(fmap(add, Just.of(6)), Just.of(7))).toStrictEqual(
                    Just.of(13)
                );
                expect(tie<typeof add>(nothing, Just.of(7))).toBe(nothing);
                expect(tie<typeof add>(fmap(add, Just.of(6)), nothing)).toBe(
                    nothing
                );
            });
        });
        describe('liftAN', () => {
            it('should return with correct value', () => {
                const liftAN2 = defineLiftAN(fmap, tie);
                expect(liftAN(add)(pure(1), pure(2))).toStrictEqual(
                    liftAN2(add)(pure(1), pure(2))
                );
                expect(liftAN(add)(pure(1), nothing)).toStrictEqual(
                    liftAN2(add)(pure(1), nothing)
                );
            });
        });
        const addMaybe = (a: number, b: number) =>
            a + b === 0 ? nothing : Just.of(a + b);

        describe('>>=', () => {
            it('should return with correct value', () => {
                expect(warp(nothing, addMaybe)(5)).toBe(nothing);
                expect(
                    warp(Just.of(5), warp(Just.of(10), addMaybe))
                ).toStrictEqual(Just.of(15));
            });
        });
        describe('>>', () => {
            it('should return with correct value', () => {
                expect(insert(nothing, Just.of(5))).toBe(nothing);
                expect(insert(Just.of(5), nothing)).toBe(nothing);
                expect(insert(Just.of(5), Just.of(11))).toStrictEqual(
                    Just.of(11)
                );
            });
        });
        describe('sequenceA', () => {
            it('should return with correct value', () => {
                expect(sequenceA([nothing, Just.of(5)])).toStrictEqual(nothing);
                expect(sequenceA([5, 6, 7].map(pure))).toStrictEqual(
                    Just.of([5, 6, 7])
                );
            });
        });
    });
});
