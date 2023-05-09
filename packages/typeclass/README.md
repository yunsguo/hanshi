# `@hanshi/typeclass`

```Typescript
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
    defineLeftTie,
    defineLift,
    defineReplace,
    defineInsert,
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
```
