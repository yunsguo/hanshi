import { fmap as arrayFmap } from '@hanshi/array-typeclass';
import {
    FirstParameter,
    Functional,
    Init,
    LastParameter,
    PartialApplied,
    ReversedPartialApplied,
    Terminal,
    Unary,
    decay as a,
    blindBind,
    partial,
    proxied,
    swapped,
    take
} from '@hanshi/prelude';
import { defineTraverse } from '@hanshi/typeclass';

class Nothing {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    maybe<A>(a: A, f: Unary<any, A>): A {
        return a;
    }
}

const nothing = new Nothing();

class Just<T = unknown> {
    [a]: T;

    private constructor($: T) {
        this[a] = $;
    }

    static of<U>(a: U) {
        return new Just<U>(a);
    }

    maybe<U>(b: U, f: Unary<T, U>): U {
        return f(this[a]);
    }

    dmap<R>(f: Unary<T, R>) {
        return f(this[a]);
    }
}

type Maybe<A = unknown> = Nothing | Just<A>;

function maybe<A, B>(b: B, f: Unary<A, B>, ma: Maybe<A>): B {
    return ma.maybe(b, f);
}

function fmap<F extends Functional>(
    f: F,
    fa: Maybe<FirstParameter<F>>
): Maybe<PartialApplied<F>> {
    return fa instanceof Nothing ? nothing : Just.of(partial(f, fa[a]));
}

function v$<A, B>(a: A, fb: Maybe<B>): Maybe<A> {
    return fb instanceof Nothing ? nothing : Just.of(a);
}

const pure = Just.of;

function tie<F extends Functional>(
    mf: Maybe<F>,
    ma: Maybe<FirstParameter<F>>
): Maybe<PartialApplied<F>> {
    return mf instanceof Just && ma instanceof Just
        ? Just.of(partial(mf[a], ma[a]))
        : nothing;
}

type MaybeMap<Ts extends unknown[]> = Ts extends [infer Head, ...infer Tail]
    ? [Maybe<Head>, ...MaybeMap<Tail>]
    : [];

type Lifted<F extends Functional> = (
    ...args: MaybeMap<Parameters<F>>
) => Maybe<ReturnType<F>>;

const liftAN = <F extends Functional>(f: F): Lifted<F> =>
    proxied(
        (target: F, args: MaybeMap<Parameters<F>>) =>
            args.some((m) => (m as unknown) instanceof Nothing)
                ? nothing
                : Just.of(target(...args.map((m) => m[a]))),
        f
    );

const rightTie: <A, B>(ma: Maybe<A>, mb: Maybe<B>) => Maybe<B> = (ma, mb) =>
    ma instanceof Nothing ? nothing : mb;

const leftTie: <A, B>(ma: Maybe<A>, mb: Maybe<B>) => Maybe<A> =
    swapped(rightTie);

function warp<F extends Terminal<Maybe>>(
    marg: Maybe<LastParameter<F>>,
    f: F
): ReversedPartialApplied<F> {
    return blindBind(
        proxied(
            (
                target: F,
                [, ...init]: [LastParameter<F>, ...Init<Parameters<F>>]
            ) =>
                (marg instanceof Nothing
                    ? nothing
                    : target(
                          ...take(target.length - 1, init),
                          marg[a]
                      )) as ReturnType<F>,
            f
        )
    ) as ReversedPartialApplied<F>;
}

const insert = rightTie;

type FTA<TFA extends unknown[]> = TFA extends [infer MaybeHead, ...infer Tail]
    ? MaybeHead extends Maybe<infer Head>
        ? [Head, ...FTA<Tail>]
        : never
    : [];

const sequenceA = <TFA extends Maybe[]>(tfa: TFA): Maybe<FTA<TFA>> =>
    tfa.some((m) => m instanceof Nothing)
        ? nothing
        : Just.of(tfa.map((m) => (m as Just)[a]));

const traverse: <A, B>(f: Unary<A, Maybe<B>>, as: A[]) => Maybe<B[]> =
    defineTraverse(arrayFmap, sequenceA);

export {
    Just,
    Maybe,
    Nothing,
    fmap,
    insert,
    leftTie,
    liftAN,
    maybe,
    nothing,
    pure,
    rightTie,
    sequenceA,
    tie,
    traverse,
    v$,
    warp
};
