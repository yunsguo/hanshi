import {
    FirstParameter,
    Functional,
    MonadicAction,
    PartialApplied,
    Unary,
    _,
    blindBind,
    left,
    modified,
    partial,
    right
} from '@hanshi/prelude';

class Nothing {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    maybe<A>(a: A, f: Unary<any, A>): A {
        return a;
    }
}
const nothing = new Nothing();

class Just<T> {
    private constructor(private $: T) {}

    public get a(): T {
        return this.$;
    }

    static of<U>(a: U) {
        return new Just<U>(a);
    }

    maybe<U>(b: U, f: Unary<T, U>): U {
        return f(this.$);
    }
}

type Maybe<A> = Nothing | Just<A>;

function maybe<A, B>(b: B, f: Unary<A, B>, ma: Maybe<A>): B {
    return ma.maybe(b, f);
}

function fmap<F extends Functional>(
    f: F,
    fa: Maybe<FirstParameter<F>>
): Maybe<PartialApplied<F>> {
    return fa instanceof Nothing ? nothing : Just.of(partial(f, fa.a));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function replace<A, B>(a: A, fb: Maybe<B>): Maybe<A> {
    return Just.of(a);
}

const pure = Just.of;

function tie<F extends Functional>(
    mf: Maybe<F>,
    ma: Maybe<FirstParameter<F>>
): Maybe<PartialApplied<F>> {
    return mf instanceof Just && ma instanceof Just
        ? Just.of(partial(mf.a, ma.a))
        : nothing;
}

const rightTie: <A, B>(ma: Maybe<A>, mb: Maybe<B>) => Maybe<B> = right;

const leftTie: <A, B>(ma: Maybe<A>, mb: Maybe<B>) => Maybe<A> = left;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compose<F extends MonadicAction<Maybe<any>>>(
    f: F,
    pa: Maybe<FirstParameter<F>>
): PartialApplied<F> {
    return blindBind(
        modified(
            (target, thisArg, [, ...args]) =>
                pa instanceof Nothing ? nothing : target(pa.a, ...args),
            f
        ) as F
    );
}

const rightCompose: typeof rightTie = right;

const leftCompose: typeof leftTie = left;

export {
    Nothing,
    nothing,
    Just,
    Maybe,
    maybe,
    fmap,
    replace,
    pure,
    tie,
    rightTie,
    leftTie,
    compose,
    rightCompose,
    leftCompose
};
