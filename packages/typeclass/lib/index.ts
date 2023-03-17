// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Binary,
    Functional,
    Unary,
    _,
    id,
    left,
    partial,
    partialCurried,
    proxied
} from '@hanshi/prelude';

const defineReplace = (fmap: Binary) => (a: any, fb: any) =>
    fmap(_(left, a), fb);

const defineLiftAN = (pure: Unary, tie: Binary) => (f: Functional) =>
    proxied((target, args) => args.reduce(tie, pure(target)), f);

const defineTie = (liftAN: Unary) => (ff: any, fa: any) =>
    liftAN(partial)(ff, fa);

const defineRightTie = (replace: Binary, tie: Binary) => (u: any, v: any) =>
    tie(replace(id, u), v);

const defineLeftTie = (liftAN: Unary) => (u: any, v: any) => liftAN(left)(u, v);

const defineTraverse = (fmap: Binary, sequenceA: Unary) => (f: any, ta: any) =>
    sequenceA(fmap(f, ta));

const defineSequenceA = (traverse: Binary) => partialCurried(traverse)(id);

export {
    defineLeftTie,
    defineLiftAN,
    defineReplace,
    defineRightTie,
    defineSequenceA,
    defineTie,
    defineTraverse
};
