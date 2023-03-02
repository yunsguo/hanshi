import { id } from '@hanshi/prelude';
import {
    Either,
    Left,
    Right,
    compose,
    either,
    fmap,
    fromLeft,
    fromRight,
    isLeft,
    isRight,
    lefts,
    partitionEithers,
    replace,
    rights,
    tie
} from '../lib/either';

describe('lib/either', () => {
    describe('either', () => {
        it('should have static polymorphic behavior', () => {
            expect(either(id, (x) => x + 1, Left.of(1))).toBe(1);
            expect(either(id, (x) => x + 1, Right.of(1))).toBe(2);
        });
    });
    describe('isLeft', () => {
        it('should return true if object is of left', () => {
            expect(isLeft(Left.of(1))).toBe(true);
            expect(isLeft(Right.of(2))).toBe(false);
            expect(isLeft(Right.of('abc'))).toBe(false);
        });
    });
    describe('lefts', () => {
        it('should return all lefts from an array of either', () => {
            const es: Either<number, number>[] = [...Array(10).keys()].map(
                (n) => (n % 2 === 0 ? Right.of(n) : Left.of(n))
            );
            expect(lefts(es)).toStrictEqual(
                [...Array(10).keys()].filter((n) => n % 2 !== 0)
            );
            expect(lefts(es.filter(isRight))).toStrictEqual([]);
        });
    });
    describe('isRight', () => {
        it('should return true if object is of Right', () => {
            expect(isRight(Left.of(1))).toBe(false);
            expect(isRight(Right.of(2))).toBe(true);
            expect(isRight(Left.of('abc'))).toBe(false);
        });
    });
    describe('rights', () => {
        it('should return all rights from an array of either', () => {
            const es: Either<number, number>[] = [...Array(10).keys()].map(
                (n) => (n % 2 === 0 ? Right.of(n) : Left.of(n))
            );
            expect(rights(es)).toStrictEqual(
                [...Array(10).keys()].filter((n) => n % 2 === 0)
            );
            expect(rights(es.filter(isLeft))).toStrictEqual([]);
        });
    });
    describe('fromLeft', () => {
        it('should return contained value if object is of Left', () => {
            expect(fromLeft(5, Left.of(1))).toBe(1);
        });
        it('should return defaulted value if object is not of Left', () => {
            expect(fromLeft(5, Right.of(1))).toBe(5);
        });
    });
    describe('fromRight', () => {
        it('should return contained value if object is of Right', () => {
            expect(fromRight(5, Right.of(1))).toBe(1);
        });
        it('should return defaulted value if object is not of Right', () => {
            expect(fromRight(5, Left.of(1))).toBe(5);
        });
    });
    describe('partitionEithers', () => {
        it('should return a pair of arrays partitioned from given an either array', () => {
            const es: Either<number, number>[] = [...Array(10).keys()].map(
                (n) => (n % 2 === 0 ? Right.of(n) : Left.of(n))
            );
            expect(partitionEithers(es)).toStrictEqual([
                [...Array(10).keys()].filter((n) => n % 2 !== 0),
                [...Array(10).keys()].filter((n) => n % 2 === 0)
            ]);
        });
    });
    describe('typeclass implementation', () => {
        const inc = (a: number) => a + 1;
        const dec = (a: number) => a - 1;
        const comp = (a: number) => dec(inc(a));
        describe('decayable', () => {
            it('should return with value mapped', () => {
                const r = Math.random();

                expect(Right.of(r).dmap(id)).toBe(r);
                expect(Right.of(r).dmap((a) => a + 1)).toBe(r + 1);
                expect(Left.of(r).dmap(id)).toBe(r);
                expect(Left.of(r).dmap((a) => a + 1)).toBe(r + 1);
            });
            it('should follow fmap restrictions', () => {
                expect(fmap(id, Right.of(5))).toStrictEqual(id(Right.of(5)));
                expect(fmap(id, Left.of(4))).toStrictEqual(id(Left.of(4)));
                expect(fmap(comp, Right.of(3))).toStrictEqual(
                    fmap(dec, fmap(inc, Right.of(3)))
                );
                expect(fmap(comp, Left.of(2))).toStrictEqual(
                    fmap(dec, fmap(inc, Left.of(2)))
                );
            });
        });
        describe('fmap', () => {
            it('should return with correct value', () => {
                expect(fmap(inc, Right.of(1))).toStrictEqual(Right.of(2));
                expect(fmap(inc, Left.of(1))).toStrictEqual(Left.of(1));
            });
            it('should follow fmap restrictions', () => {
                expect(fmap(id, Right.of(5))).toStrictEqual(id(Right.of(5)));
                expect(fmap(id, Left.of(4))).toStrictEqual(id(Left.of(4)));
                expect(fmap(comp, Right.of(3))).toStrictEqual(
                    fmap(dec, fmap(inc, Right.of(3)))
                );
                expect(fmap(comp, Left.of(2))).toStrictEqual(
                    fmap(dec, fmap(inc, Left.of(2)))
                );
            });
        });
        describe('replace', () => {
            it('should return with correct value', () => {
                expect(replace(5, Right.of(1))).toStrictEqual(Right.of(5));
                expect(replace(4, Left.of(1))).toStrictEqual(Right.of(4));
            });
        });
        const add = (a: number, b: number) => a + b;
        describe('tie', () => {
            it('should return with correct value', () => {
                expect(tie(fmap(add, Right.of(6)), Right.of(7))).toStrictEqual(
                    Right.of(13)
                );
                expect(
                    tie<typeof add, number>(Left.of(5), Right.of(7))
                ).toStrictEqual(Left.of(5));
                expect(
                    tie<typeof add, number>(fmap(add, Right.of(6)), Left.of(7))
                ).toStrictEqual(Left.of(7));
            });
        });
        const addEither = (a: number, b: number) =>
            a + b === 0 ? Left.of(0) : Right.of(a + b);
        describe('compose', () => {
            it('should return with correct value', () => {
                expect(
                    compose(compose(addEither, Left.of(5)), Left.of(6))
                ).toStrictEqual(Left.of(6));
                expect(
                    compose(compose(addEither, Right.of(5)), Left.of(6))
                ).toStrictEqual(Left.of(6));
                expect(
                    compose(compose(addEither, Right.of(5)), Right.of(6))
                ).toStrictEqual(Right.of(11));
            });
        });
    });
});
