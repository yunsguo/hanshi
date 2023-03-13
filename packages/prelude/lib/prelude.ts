// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */

type Functional = (...args: any[]) => any;

type FirstParameter<F> = F extends (...args: [infer Head, ...any[]]) => any
    ? Head
    : never;

type NPartialApplied<F, Args> = F extends (
    ...args: [infer Arg, ...infer Rest]
) => infer R
    ? Args extends [infer Head, ...infer Tails]
        ? Head extends Arg
            ? Tails extends []
                ? Rest extends []
                    ? R
                    : (...args: Rest) => R
                : NPartialApplied<(...args: Rest) => R, Tails>
            : never
        : never
    : never;

type PartialApplied<F> = NPartialApplied<F, [FirstParameter<F>]>;

function modified<F extends Functional>(
    invoke: (f: F, args: any[]) => any,
    f: F
): Functional {
    return new Proxy(f, {
        apply: (target, thisArg, argArray) => invoke(target, argArray)
    });
}

type Predicate<T = any> = Unary<T, boolean>;

const errorToString = Object.prototype.toString.call(new Error());

function isError(e: unknown): e is Error {
    return Object.prototype.toString.call(e) === errorToString;
}

class PredicateError<F> extends Error {
    constructor(
        private f: F,
        private p: Predicate<F>,
        private original: unknown
    ) {
        super(`Error applying predicate ${p} to ${f}`);

        this.name = this.constructor.name;

        Object.setPrototypeOf(this, PredicateError.prototype);

        Error.captureStackTrace(this, PredicateError); // capture stack trace of the custom error

        if (isError(original) && original.stack) {
            // append stack trace of original error
            this.stack += `\nCaused by: ${original.stack}`;
        }
    }
}

class PartialError<F extends Functional, Args> extends Error {
    constructor(private target: F, private args: Args) {
        super(
            `${target} with arity of ${target.length} can not be partially applied by ${args}. `
        );
        this.name = this.constructor.name;
    }
}

type Nullary<R = any> = () => R;

function checkWithError<F>(f: F, p: Predicate<F>, n: Nullary<Error>) {
    try {
        if (p(f)) throw n();
    } catch (e) {
        throw new PredicateError(f, p, e);
    }
}

function blindBind<F extends Functional>(f: F): PartialApplied<F> {
    checkWithError(
        f,
        (f) => f.length <= 0,
        () => new PartialError(f, [])
    );
    return f.length === 1 ? f(undefined) : f.bind(null, undefined);
}

function _<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    return f.length === 1 ? f(arg) : f.bind(null, arg);
}

function partial<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    checkWithError(
        f,
        (f) => f.length <= 0,
        () => new PartialError(f, [arg])
    );
    return _(f, arg);
}

type Prefix<T extends unknown[]> = T extends [...infer Init, infer Last]
    ? Prefix<Init> | [...Init, Last]
    : [];

type PartialParameters<F extends Functional> = Exclude<
    Prefix<Parameters<F>>,
    []
>;

function __<F extends Functional, Args extends PartialParameters<F>>(
    f: F,
    args: Args
): NPartialApplied<F, Args> {
    return f.length === args.length ? f(...args) : f.bind(null, ...args);
}

function partialN<F extends Functional, Args extends PartialParameters<F>>(
    f: F,
    args: Args
): NPartialApplied<F, Args> {
    checkWithError(
        f,
        (f) => f.length <= 0 || args.length > f.length,
        () => new PartialError(f, args)
    );
    return __(f, args);
}

class CurryingError<F extends Functional> extends Error {
    constructor(private target: F) {
        super(`${target} with arity of ${target.length} can not be curried. `);
        this.name = this.constructor.name;
    }
}

function curry<F extends Functional>(
    f: F
): Unary<FirstParameter<F>, PartialApplied<F>> {
    checkWithError(
        f,
        (f) => f.length < 2,
        () => new CurryingError(f)
    );
    return _(_<F>, f);
}

function id<T>(x: T): T {
    return x;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function left<A, B>(a: A, _: B): A {
    return a;
}

function right<A, B>(_: A, b: B): B {
    return b;
}

function withConstant<F extends Functional>(f: F, r: ReturnType<F>): F {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return modified(() => r, f) as F;
}

function chain<G extends Functional, R>(
    f: Unary<ReturnType<G>, R>,
    g: G
): (...args: Parameters<G>) => R {
    return modified((target, argArray) => f(target(...argArray)), g);
}

function swapped<F extends Binary>(
    f: F
): (arg0: Parameters<F>[1], arg1: FirstParameter<F>) => ReturnType<F> {
    return modified((g, [a, b]) => g(b, a), f);
}

const cons = <A>(a: A, as: A[]): A[] => [a, ...as];

const unspreaded =
    <F extends Functional>(f: F): Unary<Parameters<F>, ReturnType<F>> =>
    (args) =>
        f(...args);

type Unary<A = any, B = any> = (a: A) => B;

type Binary<A = any, B = any, C = any> = (a: A, b: B) => C;

type Reducer<A = any, B = any> = (a: A, b: B) => B;

type Ternary<A = any, B = any, C = any, D = any> = (a: A, b: B, c: C) => D;

type Terminal<R> = (...args: any[]) => R;

export {
    Binary,
    FirstParameter,
    Functional,
    NPartialApplied,
    Nullary,
    PartialApplied,
    PartialParameters,
    Predicate,
    Prefix,
    Reducer,
    Terminal,
    Ternary,
    Unary,
    _,
    __,
    blindBind,
    chain,
    checkWithError,
    cons,
    curry,
    id,
    left,
    modified,
    partial,
    partialN,
    right,
    swapped,
    unspreaded,
    withConstant
};
