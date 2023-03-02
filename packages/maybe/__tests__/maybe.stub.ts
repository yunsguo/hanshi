import { id } from '@hanshi/prelude';
import {
    Just,
    Nothing,
    compose,
    fmap,
    maybe,
    nothing,
    replace,
    tie
} from '../lib/maybe';

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
        describe('replace', () => {
            it('should return with correct value', () => {
                expect(replace(5, Just.of(1))).toStrictEqual(Just.of(5));
                expect(replace(4, nothing)).toStrictEqual(Just.of(4));
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
        const addMaybe = (a: number, b: number) =>
            a + b === 0 ? nothing : Just.of(a + b);
        describe('compose', () => {
            it('should return with correct value', () => {
                expect(compose(compose(addMaybe, nothing), nothing)).toBe(
                    nothing
                );
                expect(compose(compose(addMaybe, Just.of(5)), nothing)).toBe(
                    nothing
                );
                expect(
                    compose(compose(addMaybe, Just.of(5)), Just.of(6))
                ).toStrictEqual(Just.of(11));
            });
        });
    });
});
