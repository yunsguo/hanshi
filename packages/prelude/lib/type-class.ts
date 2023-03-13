// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Binary,
    Functional,
    Unary,
    _,
    cons,
    id,
    left,
    modified,
    partial
} from './prelude';

const defineDefaultedv$ = (fmap: Binary) => (a: any, fb: any) =>
    fmap(_(left, a), fb);

const defineDefaultedLiftAN = (pure: Unary, tie: Binary) => (f: Functional) =>
    modified((target, args) => args.reduce(tie, pure(target)), f);

const defineDefaultedTie = (liftAN: Unary) => (ff: any, fa: any) =>
    liftAN(partial)(ff, fa);

const defineDefaultedRightTie = (v$: Binary, tie: Binary) => (u: any, v: any) =>
    tie(v$(id, u), v);

const defineDefaultedLeftTie = (liftAN: Unary) => (u: any, v: any) =>
    liftAN(left)(u, v);

const defineDefaultedSequenceA = (pure: Unary, fmap: Binary, tie: Binary) => {
    const seqneuceA: Unary = (fa: any[]) => {
        if (fa.length === 0) return pure(fa);
        const [x, ...xs] = fa;
        return tie(fmap(cons, x), seqneuceA(xs));
    };
    return seqneuceA;
};

export {
    defineDefaultedLeftTie,
    defineDefaultedLiftAN,
    defineDefaultedRightTie,
    defineDefaultedSequenceA,
    defineDefaultedTie,
    defineDefaultedv$
};
