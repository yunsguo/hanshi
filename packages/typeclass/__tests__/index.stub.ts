import {
    FirstParameter,
    Functional,
    PartialApplied,
    Unary,
    cons,
    left,
    partial,
    proxied,
    right
} from '@hanshi/prelude';
import {
    defineInsert,
    defineLeftTie,
    defineLift,
    defineReplace,
    defineTie,
    defineTraverse
} from '../lib';

const fmap = <F extends Functional>(
    f: F,
    aa: FirstParameter<F>[]
): PartialApplied<F>[] => aa.map((a) => partial(f, a));

const v$ = <A, B>(a: A, bs: B[]): A[] => bs.map(() => a);

const replace2 = defineReplace(fmap) as <A, B>(a: A, ab: B[]) => A[];

const pure = <T>(a: T) => [a];

const tie = <F extends Functional>(af: F[], aa: FirstParameter<F>[]) =>
    aa.flatMap((a) => af.map((f) => partial(f, a)));

const lift = <F extends Functional>(f: F) =>
    proxied(
        (target, args) =>
            args
                .reduce(
                    (prev, as) =>
                        prev.length === 0
                            ? as.map((a) => [a])
                            : as.flatMap((a) => prev.map((p) => p.concat(a))),
                    []
                )
                .map((as) => target(...as)),
        f
    );
const lift2 = defineLift(fmap, tie);

const tie2 = defineTie(lift2);

const rightTie = <A, B>(as: A[], bs: B[]) =>
    bs.flatMap((b) => as.flatMap((a) => right(a, b)));

const insert2 = defineInsert(replace2, tie2);

const leftTie = <A, B>(as: A[], bs: B[]) =>
    bs.flatMap((b) => as.flatMap((a) => left(a, b)));

const leftTie2 = defineLeftTie(lift2);

const sequence = (() => {
    const sequence: Unary = (fa) => {
        if (fa.length === 0) return pure(fa);
        const [x, ...xs] = fa;
        return tie(fmap(cons, x), sequence(xs));
    };
    return sequence;
})();

const traverse = defineTraverse(fmap, sequence);

const NArrayRandom = (n: number): number[] =>
    [...Array(n).keys()].map(() => Math.random());

const NRandom = (l: number, u: number): number =>
    Math.floor(Math.random() * (u - l)) + l;

function equivenlent<F extends Functional>(f: F, g: F, args: Parameters<F>) {
    return expect(f(...args)).toStrictEqual(g(...args));
}

describe('lib/type-class', () => {
    describe('v$', () => {
        it('should provide a correct implentation', () => {
            equivenlent(replace2, v$, [
                Math.random(),
                NArrayRandom(NRandom(1, 5))
            ]);
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
            equivenlent(insert2, rightTie, [
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
    describe('sequence', () => {
        it('should provide a correct implentation', () => {
            expect(
                sequence([
                    [1, 2, 3],
                    [4, 5, 6]
                ])
            ).toStrictEqual([
                [1, 4],
                [2, 4],
                [3, 4],
                [1, 5],
                [2, 5],
                [3, 5],
                [1, 6],
                [2, 6],
                [3, 6]
            ]);
        });
    });
    describe('traverse', () => {
        it('should provide a correct implentation', () => {
            expect(traverse(pure, [1, 2, 3, 4, 5, 6])).toStrictEqual([
                [1, 2, 3, 4, 5, 6]
            ]);
        });
    });
});
