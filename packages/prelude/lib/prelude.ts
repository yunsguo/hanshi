// For pattern matching reasons, any is used in the type definitions
/* eslint-disable @typescript-eslint/no-explicit-any */
type Functional = (...args: any[]) => any;

type FirstParameter<F extends Functional> = Parameters<F>[0];

type PartialApplied<F> = F extends (arg: any, ...args: infer As) => infer R
    ? As extends []
        ? R
        : (...args: As) => R
    : never;

function _<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    return f.length === 1 ? f(arg) : f.bind(null, arg);
}

function modified<F extends Functional>(apply: ProxyHandler<F>['apply'], f: F) {
    return new Proxy(f, { apply });
}

type Lifted<F extends Functional, R> = (...args: Parameters<F>) => R;

function defaultedTryCatchHandler<F extends Functional, D>(
    defaulted: D,
    target: F,
    thisArg: null,
    argArray: Parameters<F>
): ReturnType<F> | D {
    try {
        return target(...argArray);
    } catch (e) {
        console.debug('failable', e);
        return defaulted;
    }
}

const failable: <F extends Functional>(
    f: F
) => Lifted<F, undefined | ReturnType<F>> = _(
    modified,
    _(defaultedTryCatchHandler, undefined)
);

function defaultedFailable<F extends Functional, D>(f: F, defaulted: D): F {
    return modified(_(defaultedTryCatchHandler, defaulted), f) as F;
}

class PartialError<F extends Functional, Args> extends Error {
    constructor(private target: F, private args: Args) {
        super(
            `${target} with arity of ${target.length} can not be partially applied by ${args}. `
        );
        this.name = this.constructor.name;
    }
}

const zeroArity = defaultedFailable((f) => f.length === 0, false);

function partial<F extends Functional>(
    f: F,
    arg: FirstParameter<F>
): PartialApplied<F> {
    if (zeroArity(f)) throw new PartialError(f, [arg]);
    return _(f, arg);
}

type Prefix<T extends unknown[]> = T extends [...infer Init, infer Last]
    ? Prefix<Init> | [...Init, Last]
    : [];

type NPartialApplied<F, Args> = F extends (
    arg: infer A,
    ...args: any[]
) => unknown
    ? Args extends [infer Head, ...infer Tails]
        ? Head extends A
            ? Tails extends []
                ? PartialApplied<F>
                : NPartialApplied<PartialApplied<F>, Tails>
            : never
        : never
    : never;

const wrongArity = defaultedFailable(
    (f, args) => f.length === 0 || args.length > f.length,
    false
);

/**
 *
 * @param f
 * @param args
 * @returns
 */
function partialN<
    F extends Functional,
    Args extends Exclude<Prefix<Parameters<F>>, []>
>(f: F, args: Args): NPartialApplied<F, Args> {
    if (wrongArity(f, args)) throw new PartialError(f, args);
    return f.length === args.length ? f(...args) : f.bind(null, ...args);
}

class CurryingError<F extends Functional> extends Error {
    constructor(private target: F) {
        super(`${target} with arity of ${target.length} can not be curried. `);
        this.name = this.constructor.name;
    }
}

const arityLessThan2 = defaultedFailable((f) => f.length < 2, false);

function curry<F extends Functional>(
    f: F
): Unary<FirstParameter<F>, PartialApplied<F>> {
    if (arityLessThan2(f)) throw new CurryingError(f);
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

/**
 *
 * @param f
 * @param r
 * @returns
 */
function withConstant<F extends Functional>(f: F, r: ReturnType<F>): F {
    return new Proxy(f, {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        apply: _((result, target, thisArg, argArray) => result, r)
    });
}

type Unary<A, B> = (a: A) => B;

type Binary<A, B, C> = (a: A, b: B) => C;

type Ternary<A, B, C, D> = (a: A, b: B, c: C) => D;

type Assigned<H, F> = F extends (...args: infer Rest) => infer R
    ? (a: H, ...args: Rest) => R
    : never;

type MonadicAction<R> = (...args: any[]) => R;

export {
    Functional,
    FirstParameter,
    _,
    modified,
    partial,
    PartialApplied,
    partialN,
    NPartialApplied,
    failable,
    defaultedFailable,
    curry,
    id,
    left,
    right,
    withConstant,
    Unary,
    Binary,
    Ternary,
    Assigned,
    MonadicAction
};
