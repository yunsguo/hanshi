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

type Either<A, B> = Left<A> | Right<B>;

class Left<T> {
    [Typeclass.decay]: T;
    private constructor(val: T) {
        this[Typeclass.decay] = val;
    }

    static of<U>(val: U): Left<U> & Monad<U> {
        return withTraits(new Left<U>(val));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(f: Unary<T, R>, _: unknown): R {
        return f(this[Typeclass.decay]);
    }
}

class Right<T> {
    [Typeclass.decay]: T;
    private constructor(val: T) {
        this[Typeclass.decay] = val;
    }

    static of<U>(val: U): Right<U> & Monad<U> {
        return withTraits(new Right<U>(val));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(_: unknown, f: Unary<T, R>): R {
        return f(this[Typeclass.decay]);
    }
}

function either<A, B, C>(m1: Unary<C, B>, m2: Unary<A, B>, e: Either<C, A>): B {
    return e.either(m1, m2);
}

const functorTrait: FunctorTrait = withCompliantFunctor({
    fmap: <A, B>(f: Unary<A, B>, fa: Either<unknown, A>) =>
        fa instanceof Right
            ? Right.of(partialApply(f, fa[Typeclass.decay]))
            : fa,
    replace: Right.of
});

const applicativeTrait: ApplicativeTrait = withCompliantApplicative({
    pure: Right.of,
    tie: (f, e) =>
        f instanceof Right ? functorTrait.fmap(f[Typeclass.decay], e) : f,
    rightTie: right,
    leftTie: left
});

const monadTrait: MonadTrait = withCompliantMonad(
    {
        bind: (f, ma) =>
            ma instanceof Right
                ? partialApply(f, ma[Typeclass.decay])
                : withSingularity<PartialApplied<typeof f>>(ma),
        compose: right
    },
    applicativeTrait
);

function withTraits<A, T extends Left<A> | Right<A>>(
    target: T
): T & Monad<unknown> {
    return Object.assign(target, {
        [Typeclass.functor]: functorTrait,
        [Typeclass.applicable]: applicativeTrait,
        [Typeclass.monad]: monadTrait
    });
}

export { Either, Left, Right, either };
