// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EOL } from 'os';

/**
 * The umbrella type for any function that can be invoked or partially applied.
 */
type Functional = (...args: any[]) => any;

type FirstParameter<F> = F extends (...args: [infer Head, ...infer Tail]) => any
    ? Head
    : never;

type SecondParameter<F> = F extends (
    ...args: [infer First, infer Second, ...infer Tail]
) => any
    ? Second
    : never;

type LastParameter<F> = F extends (...args: [...infer Init, infer Last]) => any
    ? Last
    : F extends (arg: infer Last) => any
    ? Last
    : never;

type NPartialApplied<F, Args> = F extends (
    ...args: [infer Arg, ...infer Rest]
) => infer R
    ? Args extends [infer Head, ...infer Tail]
        ? Head extends Arg
            ? Tail extends []
                ? Rest extends []
                    ? R
                    : (...args: Rest) => R
                : NPartialApplied<(...args: Rest) => R, Tail>
            : never
        : never
    : never;

type PartialApplied<F> = NPartialApplied<F, [FirstParameter<F>]>;

function proxied<Invoke extends Binary>(
    invoke: Invoke,
    f: FirstParameter<Invoke>
): (...args: SecondParameter<Invoke>) => ReturnType<Invoke> {
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

function chain<G extends Functional, R>(f: Unary<ReturnType<G>, R>, g: G) {
    return proxied(
        (target: G, argArray: Parameters<G>) => f(target(...argArray)),
        g
    );
}

function swapped<F extends Binary>(f: F) {
    return proxied(
        (g: F, [a, b]: [SecondParameter<F>, FirstParameter<F>]) => g(b, a),
        f
    );
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

// function _R<F extends Functional>(
//     f: F,
//     arg: LastParameter<F>
// ): PartialApplied<F> {
//     return f.length === 1 ? f(arg) : proxied((target,args)=>,f);
// }

const take = <A>(n: number, as: A[]): A[] => (n < 0 ? [] : as.slice(0, n));

type ReversedNPartialApplied<F, Args> = F extends (
    ...args: [...infer Rest, infer Arg]
) => infer R
    ? Args extends [...infer Init, infer Last]
        ? Last extends Arg
            ? Init extends []
                ? Rest extends []
                    ? R
                    : (...args: Rest) => R
                : NPartialApplied<(...args: Rest) => R, Init>
            : never
        : never
    : never;

type ReversedPartialApplied<F> = NPartialApplied<F, [LastParameter<F>]>;

type Head<As extends unknown[]> = As extends [infer Head, ...infer Tail]
    ? Head
    : never;

type Tail<As extends unknown[]> = As extends [infer Head, ...infer Tail]
    ? Tail
    : never;

type Init<As extends unknown[]> = As extends [...infer Init, infer Last]
    ? Init
    : never;

type Last<As extends unknown[]> = As extends [...infer Init, infer Last]
    ? Last
    : never;

// const blindBindReverse = <F extends Functional>(f: F): PartialApplied<F> =>
//     partial(f, undefined as FirstParameter<F>);

export {
    ArityError,
    Binary,
    FirstParameter,
    Functional,
    Head,
    Init,
    Last,
    LastParameter,
    NPartialApplied,
    Nullary,
    PartialApplied,
    PartialParameters,
    Predicate,
    Prefix,
    Reducer,
    ReversedNPartialApplied,
    ReversedPartialApplied,
    Tail,
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
    take,
    unspreaded,
    withConstant
};
