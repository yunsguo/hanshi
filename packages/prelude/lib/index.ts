// For ease of function definition, no-unused-vars is disabled.
// For pattern matching reasons, any is used in the type definitions.
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EOL } from 'os';

/**
 * The umbrella type `functional` for any function that can be invoked or partially applied.
 */
type Functional = (...args: any[]) => any;

/**
 * Obtain the first parameter of a `functional`.
 */
type FirstParameter<F> = F extends (...args: [infer Head, ...infer Tail]) => any
    ? Head
    : never;

/**
 * Obtain the second parameter of a `functional`.
 */
type SecondParameter<F> = F extends (
    ...args: [infer First, infer Second, ...infer Tail]
) => any
    ? Second
    : never;

/**
 * Obtain the last parameter of a `functional`.
 */
type LastParameter<F> = F extends (...args: [...infer Init, infer Last]) => any
    ? Last
    : F extends (arg: infer Last) => any
    ? Last
    : never;

/**
 * Obtain the nth order partially applied type given the original `functional` and applying parameters.
 */
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

/**
 * Obtain the 1st order partially applied type given the original `functional`.
 */
type PartialApplied<F> = NPartialApplied<F, [FirstParameter<F>]>;

/**
 * Obtain a proxied version of a `functional` with the given invocation trap.
 * @param invoke invocation trap for the proxy
 * @param f the target function
 * @returns a proxied function with invocation changed
 */
function proxied<F extends Functional, Invoke extends Binary<F>>(
    invoke: Invoke,
    f: F
): (...args: SecondParameter<Invoke>) => ReturnType<Invoke> {
    return new Proxy(f, {
        apply: (target, thisArg, argArray) => invoke(target, argArray)
    });
}

/**
 * A predicate is a unary function that takes a given type and returns a boolean.
 */
type Predicate<T = any> = Unary<T, boolean>;

const errorToString = Object.prototype.toString.call(new Error());

function isError(e: unknown): e is Error {
    return Object.prototype.toString.call(e) === errorToString;
}

/**
 * A predicate error is thrown when any error is thrown applying a predicate.
 */
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

/**
 * An arity error is thrown when the arity of the function can not sustain the corrispoding operation.
 */
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

/**
 * A nullary function is a function that takes nothing and return a given type when invoked.
 */
type Nullary<R = any> = () => R;

function checkWithError<F>(f: F, p: Predicate<F>, n: Nullary<Error>) {
    try {
        if (p(f)) throw n();
    } catch (e) {
        throw new PredicateError(f, p, e);
    }
}

/**
 * 1st order partially apply a given parameter to a given `functional` __without__ arity checks.
 * @param f the target function
 * @param arg the parameter to be applied
 * @returns the applied result
 */
function _<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    return f.length === 1 ? f(arg) : f.bind(null, arg);
}

/**
 * Partially curry a given `functional`
 * @param f the target function
 * @returns the partially curried function
 */
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

/**
 * 1st order partially apply a given parameter with a given `functional` __with__ arity checks.
 * @param f the target function
 * @param arg the parameter to be applied
 * @returns the applied result
 */
const partial: <F extends Functional>(
    f: F,
    arg: FirstParameter<F>
) => PartialApplied<F> = (f, arg) => partialCurried(f)(arg);

/**
 * Blindly 1st order partially apply a given `functional` to preseve the internal structure.
 * @param f the target function
 * @returns the applied result
 */
const blindBind = <F extends Functional>(f: F): PartialApplied<F> =>
    partial(f, undefined as FirstParameter<F>);

/**
 * Obtain all possible prefix for a given tuple.
 */
type Prefix<T extends unknown[]> = T extends [...infer Init, infer Last]
    ? Prefix<Init> | [...Init, Last]
    : [];

/**
 * Obtain all possible prefix except empty for a given tuple.
 */
type PartialParameters<F extends Functional> = Exclude<
    Prefix<Parameters<F>>,
    []
>;

/**
 * Nth order partially apply given parameters to a given `functional` __without__ arity checks.
 * @param f the target function
 * @param args a tuple of parameters to be applied
 * @returns the applied result
 */
function __<F extends Functional, Args extends PartialParameters<F>>(
    f: F,
    args: Args
): NPartialApplied<F, Args> {
    return f.length === args.length ? f(...args) : f.bind(null, ...args);
}

/**
 * Nth order partially apply given parameters to a given `functional` __with__ arity checks.
 * @param f the target function
 * @param args a tuple of parameters to be applied
 * @returns the applied result
 */
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

/**
 * Currying is the process of transforming a function that takes multiple arguments in a tuple as its argument, into a function that takes just a single argument and returns another function which accepts further arguments, one by one, that the original function would receive in the rest of that tuple.
 */
type Curried<F extends Functional> = F extends Unary
    ? F
    : (a: FirstParameter<F>) => Curried<PartialApplied<F>>;

const _curry = <F extends Functional>(f: F): Curried<F> =>
    (f.length === 1
        ? f
        : (a: FirstParameter<F>) => _curry(_(f, a))) as Curried<F>;

/**
 * Obtain the fully curried function from a given `functional`.
 * @param f the target function
 * @returns a fully curried version of `f`
 */
function curry<F extends Functional>(f: F): Curried<F> {
    checkWithError(
        f,
        (f) => f.length <= 1,
        () => new ArityError(f, undefined)
    );
    return _curry(f);
}

/**
 * return what is given.
 * @param x
 * @returns `x`
 */
const id = <T>(x: T): T => x;

/**
 * Given two parameters, return the former one.
 * @param a
 * @param _
 * @returns a
 */
const left = <A, B>(a: A, _: B): A => a;

/**
 * Given two parameters, return the latter one.
 * @param a
 * @param _
 * @returns a
 */
const right = <A, B>(_: A, b: B): B => b;

/**
 * Obtain a constant function from a given `functional and a return value.
 * @param f the target function
 * @param r the return value
 * @returns a constant function that always returns `r`
 */
function withConstant<F extends Functional>(f: F, r: ReturnType<F>): F {
    return proxied(() => r, f) as F;
}

/**
 * chaining two funcions together such that if `h` = `chain`(`f`,  `g`), then `h`(x) === `f`(`g`(x)).
 * @param f
 * @param g
 * @returns `h`
 */
function chain<G extends Functional, R>(f: Unary<ReturnType<G>, R>, g: G) {
    return proxied(
        (target: G, argArray: Parameters<G>) => f(target(...argArray)),
        g
    );
}

/**
 * swap the order of parameters for a given binary function.
 * @param f
 * @returns a swapped version of `f`
 */
function swapped<F extends Binary>(f: F) {
    return proxied(
        (g: F, [a, b]: [SecondParameter<F>, FirstParameter<F>]) => g(b, a),
        f
    );
}

/**
 * Construct a new array with `a` as the head and `as` as the tail.
 * @param a
 * @param as
 * @returns a new array with a new head
 */
const cons = <A>(a: A, as: A[]): A[] => [a, ...as];

/**
 * Extract everything except the last element of the stream.
 * @param xs
 * @returns a new array without previous last element
 */
const init = <A>(xs: A[]): A[] => xs.slice(0, -1);

/**
 * Take a function and return a unary version that takes a tuple of parameters
 * @param f
 * @returns a funtion that takes a tuple of parameters
 */
const unspreaded =
    <F extends Functional>(f: F): Unary<Parameters<F>, ReturnType<F>> =>
    (args) =>
        f(...args);

/**
 * A unary function is a function that takes only one parameter.
 */
type Unary<A = any, B = any> = (a: A) => B;

/**
 * A binary function is a function that takes two parameters.
 */
type Binary<A = any, B = any, C = any> = (a: A, b: B) => C;

/**
 * A reducer is a left reduction function.
 */
type Reducer<A = any, B = any> = (a: A, b: B) => B;

/**
 * A binary function is a function that takes three parameters.
 */
type Ternary<A = any, B = any, C = any, D = any> = (a: A, b: B, c: C) => D;

/**
 * A terminal function of R is a function that returns a value of type R.
 */
type Terminal<R> = (...args: any[]) => R;

/**
 * Extract the first `n` element from the given array
 * @param n
 * @param as
 * @returns a new array with the first n element
 */
const take = <A>(n: number, as: A[]): A[] => (n < 0 ? [] : as.slice(0, n));

/**
 * __In reverse order__, obtain the nth order partially applied type given the original `functional` and applying parameters.
 */
type ReversedNPartialApplied<F, Args> = F extends (
    ...args: [...infer Rest, infer Arg]
) => infer R
    ? Args extends [...infer Init, infer Last]
        ? Last extends Arg
            ? Init extends []
                ? Rest extends []
                    ? R
                    : (...args: Rest) => R
                : ReversedNPartialApplied<(...args: Rest) => R, Init>
            : never
        : never
    : never;

/**
 * __In reverse order__, obtain the 1st order partially applied type given the original `functional`.
 */
type ReversedPartialApplied<F> = ReversedNPartialApplied<F, [LastParameter<F>]>;

/**
 * Extract the first element from the given tuple.
 */
type Head<As extends unknown[]> = As extends [infer Head, ...infer Tail]
    ? Head
    : never;

/**
 * Extract the rest of the elements from the given tuple except the first one.
 */
type Tail<As extends unknown[]> = As extends [infer Head, ...infer Tail]
    ? Tail
    : never;

/**
 * Extract the rest of the elements from the given tuple except the last one.
 */
type Init<As extends unknown[]> = As extends [...infer Init, infer Last]
    ? Init
    : never;

/**
 * Extract the last element from the given tuple.
 */
type Last<As extends unknown[]> = As extends [...infer Init, infer Last]
    ? Last
    : never;

export {
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
