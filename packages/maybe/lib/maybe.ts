import {
    ApplicativeTrait,
    FunctorTrait,
    left,
    Monad,
    MonadTrait,
    PartialApplied,
    partialApply,
    right,
    Typeclass,
    Unary,
    withCompliantApplicative,
    withCompliantFunctor,
    withCompliantMonad,
    withSingularity
} from '@hanshi/prelude';

class Nothing {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    maybe<B>(b: B, f: Unary<any, B>): B {
        return b;
    }
}
const nothing = new Nothing();

class Just<T> {
    [Typeclass.decay]: T;
    private constructor(val: T) {
        this[Typeclass.decay] = val;
    }

    static of<U>(a: U) {
        return new Just<U>(a);
    }

    maybe<B>(b: B, f: Unary<T, B>): B {
        return f(this[Typeclass.decay]);
    }
}

type Maybe<A> = Nothing | Just<A>;

function maybe<A, B>(b: B, f: Unary<A, B>, ma: Maybe<A>): B {
    return ma.maybe(b, f);
}

const functorTrait: FunctorTrait = withCompliantFunctor({
    fmap: <A, B>(f: Unary<A, B>, fa: Maybe<A>) =>
        fa instanceof Just
            ? Just.of(partialApply(f, fa[Typeclass.decay]))
            : nothing,
    replace: Just.of
});

const applicativeTrait: ApplicativeTrait = withCompliantApplicative({
    pure: Just.of,
    tie: (af, aa) =>
        af instanceof Just
            ? functorTrait.fmap(af[Typeclass.decay], aa)
            : nothing,
    rightTie: right,
    leftTie: left
});

const monadTrait: MonadTrait = withCompliantMonad(
    {
        bind: (f, ma) =>
            ma instanceof Just
                ? partialApply(f, ma[Typeclass.decay])
                : withSingularity<PartialApplied<typeof f>>(nothing),
        compose: right
    },
    applicativeTrait
);

export { Nothing, nothing, Just, maybe, functorTrait, applicativeTrait, monadTrait };
