import { Functional, chain, id } from '@hanshi/prelude';
import {
    defineInsert,
    defineLeftTie,
    defineLift,
    defineReplace,
    defineSequence,
    defineTie,
    defineTraverse
} from '@hanshi/typeclass';
import {
    fmap,
    insert,
    leftTie,
    lift,
    pure,
    sequence,
    tie,
    traverse,
    v$,
    warp
} from '../lib';

const v$2: typeof v$ = defineReplace(fmap);

const tie2 = defineTie(lift);

const lift2 = defineLift(fmap, tie);

const insert2 = defineInsert(v$2, tie2);

const leftTie2 = defineLeftTie(lift2);

const seqneuce2: typeof sequence = defineSequence(traverse);

const traverse2 = defineTraverse(fmap, sequence);

const NArrayRandom = (n: number): number[] =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [...Array(n).keys()].map((a) => Math.random());

const NRandom = (l: number, u: number): number =>
    Math.floor(Math.random() * (u - l)) + l;

function equivenlent<F extends Functional>(f: F, g: F, args: Parameters<F>) {
    return expect(f(...args)).toStrictEqual(g(...args));
}

describe('lib/type-class', () => {
    describe('v$', () => {
        it('should provide a correct implentation', () => {
            equivenlent(v$2, v$, [Math.random(), NArrayRandom(NRandom(1, 5))]);
        });
    });
    const linear = (a: number, b: number, c: number) => a * b + c;
    describe('lift', () => {
        it('should provide a correct implentation', () => {
            equivenlent(
                lift2(linear),
                lift(linear),
                [...Array(3).keys()].map(() => NArrayRandom(NRandom(1, 10)))
            );
        });
    });
    const fac = (n: number) => (n <= 0 ? 1 : fac(n - 1) * n);
    const inc = (n: number) => n + 1;
    const dec = (n: number) => n - 1;
    const total = (n: number): number[] => [fac, inc, dec].map((f) => f(n));

    describe('tie', () => {
        it('should provide a correct implentation', () => {
            equivenlent(tie2, tie, [
                [fac, inc, dec],
                NArrayRandom(NRandom(2, 10))
            ]);
        });
    });
    describe('rightTie', () => {
        it('should provide a correct implentation', () => {
            equivenlent(insert2, insert, [
                NArrayRandom(NRandom(2, 10)),
                NArrayRandom(NRandom(2, 10))
            ]);
        });
    });
    describe('leftTie', () => {
        it('should provide a correct implentation', () => {
            equivenlent(leftTie2, leftTie, [
                NArrayRandom(NRandom(2, 10)),
                NArrayRandom(NRandom(2, 10))
            ]);
        });
    });
    describe('warp', () => {
        it('should provide a correct implentation', () => {
            expect(warp([1, 2, 3, 4, 5], total)).toStrictEqual([
                1, 2, 0, 2, 3, 1, 6, 4, 2, 24, 5, 3, 120, 6, 4
            ]);
            expect(
                warp(
                    [-1, 0, 1, 2],
                    warp(
                        [-2, -1, 0, 1, 2, 3],
                        warp([-1, 0, 1], chain(pure, linear))
                    )
                )
            ).toStrictEqual([
                1, 2, 3, 0, 1, 2, -1, 0, 1, -2, -1, 0, -3, -2, -1, -4, -3, -2,
                -1, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -3,
                -2, -1, -2, -1, 0, -1, 0, 1, 0, 1, 2, 1, 2, 3, 2, 3, 4, -5, -4,
                -3, -3, -2, -1, -1, 0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7
            ]);
        });
    });
    describe('sequence', () => {
        it('should provide a correct implentation', () => {
            equivenlent(seqneuce2, sequence, [
                [
                    NArrayRandom(NRandom(2, 10)),
                    NArrayRandom(NRandom(2, 10)),
                    NArrayRandom(NRandom(2, 10))
                ]
            ]);
        });
    });
    describe('traverse2', () => {
        it('should provide a correct implentation', () => {
            equivenlent(traverse2, traverse, [
                id,
                [
                    NArrayRandom(NRandom(2, 10)),
                    NArrayRandom(NRandom(2, 10)),
                    NArrayRandom(NRandom(2, 10))
                ]
            ]);
        });
    });
});
