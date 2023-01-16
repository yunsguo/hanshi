// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Functional = (...args: any) => any;

type Unary<A, B> = (arg0: A) => B;

type Binary<A, B, C> = (a: A, b: B) => C;

type Ternary<A, B, C, D> = (a: A, b: B, c: C) => D;

type FirstParameter<F extends Functional> = Parameters<F>[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PartialApplied<F> = F extends (arg: any, ...args: infer Ts) => infer R
    ? Parameters<F> extends []
        ? never
        : Ts extends []
        ? R
        : (...args: Ts) => R
    : never;

/**
 * `partialApply :: (a -> b -> c) -> a -> (b -> c)`
 * @template F, As
 * @param {F} f
 * @param {FirstParameter<F>} arg
 * @returns {PartialApplied<F>}
 */
function partialApply<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    return f.length == 1 ? f(arg) : f.bind(null, arg);
}

export {
    Functional,
    Unary,
    Binary,
    Ternary,
    FirstParameter,
    partialApply,
    PartialApplied
};
