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
    defineLiftAN,
    defineReplace,
    defineRightTie,
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

const liftAN = <F extends Functional>(f: F) =>
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
const liftAN2 = defineLiftAN(fmap, tie);

const tie2 = defineTie(liftAN2);

const rightTie = <A, B>(as: A[], bs: B[]) =>
    bs.flatMap((b) => as.flatMap((a) => right(a, b)));

const rightTie2 = defineRightTie(replace2, tie2);

const leftTie = <A, B>(as: A[], bs: B[]) =>
    bs.flatMap((b) => as.flatMap((a) => left(a, b)));

const leftTie2 = defineLeftTie(liftAN2);

const sequenceA = (() => {
    const sequenceA: Unary = (fa) => {
        if (fa.length === 0) return pure(fa);
        const [x, ...xs] = fa;
        return tie(fmap(cons, x), sequenceA(xs));
    };
    return sequenceA;
})();

const traverse = defineTraverse(fmap, sequenceA);
```
