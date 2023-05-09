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

/**
 * Define functor method `<$`(replace) from `fmap`.
 * @param fmap `fmap` definition
 * @returns the `<$`(replace) definition
 */
const defineReplace = (fmap: Binary) => (a: any, fb: any) =>
    fmap(_(left, a), fb);

/**
 * Define applicative method `lift` from `pure` and `<*>`(tie).
 * @param pure `pure` definition
 * @param tie `<*>`(tie) definition
 * @returns the `lift` definition
 */
const defineLift = (fmap: Binary, tie: Binary) => (f: Functional) =>
    proxied(
        (target, [head, ...tail]) => tail.reduce(tie, fmap(target, head)),
        f
    );

/**
 * Define applicative method `<*>`(tie) from `lift`.
 * @param lift `lift` definition
 * @returns the `<*>`(tie) definition
 */
const defineTie = (lift: Unary) => (ff: any, fa: any) => lift(partial)(ff, fa);

/**
 * Define `*>`(rightTie) from `<$`(replace) and `<*>`(tie).
 * @param replace `<$`(replace) definition
 * @param tie `<*>`(tie) definition
 * @returns the `*>`(rightTie) definition
 */
const defineInsert = (replace: Binary, tie: Binary) => (u: any, v: any) =>
    tie(replace(id, u), v);

/**
 * Define `<*`(leftTie) from `lift`.
 * @param lift `lift` definition
 * @returns the `<*`(leftTie) definition
 */
const defineLeftTie = (lift: Unary) => (u: any, v: any) => lift(left)(u, v);

/**
 * Define `traverse` from `fmap` and `sequence`.
 * @param fmap `fmap` definition
 * @param sequence `sequence` definition
 * @returns the `traverse` definition
 */
const defineTraverse = (fmap: Binary, sequence: Unary) => (f: any, ta: any) =>
    sequence(fmap(f, ta));

/**
 * Define `sequence` from `traverse`.
 * @param traverse `traverse` definition
 * @returns the `sequence` definition
 */
const defineSequence = (traverse: Binary) => partialCurried(traverse)(id);

export {
    defineInsert,
    defineLeftTie,
    defineLift,
    defineReplace,
    defineSequence,
    defineTie,
    defineTraverse
};
