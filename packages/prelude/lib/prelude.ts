// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Functional = (...args: any) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionalWithReturnType<R> = (...args: any) => R;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PartialApplied<F> = F extends (arg: any, ...args: infer Ts) => infer R
    ? Parameters<F> extends []
        ? never
        : Ts extends []
        ? R
        : (...args: Ts) => R
    : never;

type FirstParameter<F extends Functional> = Parameters<F>[0];

/**
 * partialApply :: (a -> b -> c) -> a -> (b -> c)
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

function curry<F extends Functional>(f: F) {
    return (arg: FirstParameter<F>) => partialApply(f, arg);
}

function id<T>(x: T): T {
    return x;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function left<A, B>(a: A, _: B): A {
    return a;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function right<A, B>(_: A, b: B): B {
    return b;
}

type Unary<A, B> = (arg0: A) => B;

function withSingularity<F extends Functional>(f: F, r: ReturnType<F>): F {
    return new Proxy(f, {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        apply: (target, thisArg, argumentsList) => r
    }) as F;
}

export {
    FirstParameter,
    Functional,
    FunctionalWithReturnType,
    Unary,
    PartialApplied,
    partialApply,
    curry,
    id,
    left,
    right,
    withSingularity
};
