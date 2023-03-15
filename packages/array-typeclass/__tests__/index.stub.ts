import {
    Functional,
    defineLeftTie,
    defineLiftAN,
    defineReplace,
    defineRightTie,
    defineSequenceA,
    defineTie,
    defineTraverse,
    id
} from '@hanshi/prelude';
import {
    fmap,
    leftTie,
    liftAN,
    pure,
    rightTie,
    sequenceA,
    tie,
    traverse,
    v$,
    warp
} from '../lib';

const v$2: typeof v$ = defineReplace(fmap);

const tie2 = defineTie(liftAN);

const liftAN2 = defineLiftAN(pure, tie);

const rightTie2 = defineRightTie(v$2, tie2);

const leftTie2 = defineLeftTie(liftAN2);

const seqneuceA2: typeof sequenceA = defineSequenceA(traverse);

const traverse2 = defineTraverse(fmap, sequenceA);

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
    describe('liftAN', () => {
        it('should provide a correct implentation', () => {
            equivenlent(
                liftAN2(linear),
                liftAN(linear),
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
            equivenlent(rightTie2, rightTie, [
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
        });
    });
    describe('sequenceA', () => {
        it('should provide a correct implentation', () => {
            equivenlent(seqneuceA2, sequenceA, [
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
