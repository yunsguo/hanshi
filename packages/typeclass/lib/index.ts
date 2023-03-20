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
 * Define applicative method `liftAN` from `pure` and `<*>`(tie).
 * @param pure `pure` definition
 * @param tie `<*>`(tie) definition
 * @returns the `liftAN` definition
 */
const defineLiftAN = (fmap: Binary, tie: Binary) => (f: Functional) =>
    proxied(
        (target, [head, ...tail]) => tail.reduce(tie, fmap(target, head)),
        f
    );

/**
 * Define applicative method `<*>`(tie) from `liftAN`.
 * @param liftAN `liftAN` definition
 * @returns the `<*>`(tie) definition
 */
const defineTie = (liftAN: Unary) => (ff: any, fa: any) =>
    liftAN(partial)(ff, fa);

/**
 * Define `*>`(rightTie) from `<$`(replace) and `<*>`(tie).
 * @param replace `<$`(replace) definition
 * @param tie `<*>`(tie) definition
 * @returns the `*>`(rightTie) definition
 */
const defineRightTie = (replace: Binary, tie: Binary) => (u: any, v: any) =>
    tie(replace(id, u), v);

/**
 * Define `<*`(leftTie) from `liftAN`.
 * @param liftAN `liftAN` definition
 * @returns the `<*`(leftTie) definition
 */
const defineLeftTie = (liftAN: Unary) => (u: any, v: any) => liftAN(left)(u, v);

/**
 * Define `traverse` from `fmap` and `sequenceA`.
 * @param fmap `fmap` definition
 * @param sequenceA `sequenceA` definition
 * @returns the `traverse` definition
 */
const defineTraverse = (fmap: Binary, sequenceA: Unary) => (f: any, ta: any) =>
    sequenceA(fmap(f, ta));

/**
 * Define `sequenceA` from `traverse`.
 * @param traverse `traverse` definition
 * @returns the `sequenceA` definition
 */
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
