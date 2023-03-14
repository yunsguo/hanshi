// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EOL } from 'os';

/**
 * The umbrella type for any function that can be invoked or partially applied.
 */
type Functional = (...args: any[]) => any;

type FirstParameter<F> = F extends (...args: [infer Head, ...any[]]) => any
    ? Head
    : never;

type SecondParameter<F> = F extends (
    ...args: [any, infer Second, ...any[]]
) => any
    ? Second
    : never;

type LastParameter<F> = F extends (...args: [...any[], infer Last]) => any
    ? Last
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

function proxied<F extends Functional>(
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
        super(`failed applying predicate ${p} to ${f}`);

        this.name = this.constructor.name;

        Object.setPrototypeOf(this, PredicateError.prototype);

        Error.captureStackTrace(this, PredicateError);

        if (isError(original) && original.stack)
            this.stack += EOL + `Caused by: ${original.stack}`;
    }
}

class ArityError<F extends Functional, Args> extends Error {
    constructor(private target: F, private args: Args) {
        super(
            args === undefined
                ? `${target} with arity of ${target.length} can not be partially applied. `
                : `${target} with arity of ${target.length} can not be partially applied by ${args}. `
        );

        this.name = this.constructor.name;

        Object.setPrototypeOf(this, ArityError.prototype);
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

function _<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    return f.length === 1 ? f(arg) : f.bind(null, arg);
}

function partialCurried<F extends Functional>(
    f: F
): Unary<FirstParameter<F>, PartialApplied<F>> {
    checkWithError(
        f,
        (f) => f.length <= 0,
        () => new ArityError(f, undefined)
    );
    return _(_<F>, f);
}

const partial: <F extends Functional>(
    f: F,
    arg: FirstParameter<F>
) => PartialApplied<F> = (f, arg) => partialCurried(f)(arg);

const blindBind = <F extends Functional>(f: F): PartialApplied<F> =>
    partial(f, undefined as FirstParameter<F>);

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
        () => new ArityError(f, args)
    );
    return __(f, args);
}

type Curried<F extends Functional> = F extends Unary
    ? F
    : (a: FirstParameter<F>) => Curried<PartialApplied<F>>;

const _curry = <F extends Functional>(f: F): Curried<F> =>
    (f.length === 1
        ? f
        : (a: FirstParameter<F>) => _curry(_(f, a))) as Curried<F>;

function curry<F extends Functional>(f: F): Curried<F> {
    checkWithError(
        f,
        (f) => f.length <= 1,
        () => new ArityError(f, undefined)
    );
    return _curry(f);
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
    return proxied(() => r, f) as F;
}

function chain<G extends Functional, R>(
    f: Unary<ReturnType<G>, R>,
    g: G
): (...args: Parameters<G>) => R {
    return proxied((target, argArray) => f(target(...argArray)), g);
}

function swapped<F extends Binary>(
    f: F
): (arg0: SecondParameter<F>, arg1: FirstParameter<F>) => ReturnType<F> {
    return proxied((g, [a, b]) => g(b, a), f);
}

const cons = <A>(a: A, as: A[]): A[] => [a, ...as];

/**
 * Extract everything except the last element of the stream.
 * @param xs
 * @returns
 */
const init = <A>(xs: A[]): A[] => xs.slice(0, -1);

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
    LastParameter,
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
    _curry,
    blindBind,
    chain,
    checkWithError,
    cons,
    curry,
    id,
    init,
    left,
    partial,
    partialCurried,
    partialN,
    proxied,
    right,
    swapped,
    unspreaded,
    withConstant
};
