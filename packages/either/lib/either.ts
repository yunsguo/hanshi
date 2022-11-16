import { compose, left, leftTie, remit, right } from '@hanshi/prelude';
import {
    bind,
    decay,
    FirstParameter,
    fmap,
    Functional,
    FunctionalWithReturnType,
    PartialApplied,
    partialApply,
    pure,
    replace,
    rightTie,
    tie,
    Unary,
    withSingularity
} from '@hanshi/prelude';

type Either<A, B> = Left<A> | Right<B>;

class Left<T> {
    [decay]: T;
    constructor(val: T) {
        this[decay] = val;
    }

    static of<U>(val: U): Left<U> {
        return new Left<U>(val);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(f: Unary<T, R>, _: unknown): R {
        return f(this[decay]);
    }
}

class Right<T> {
    [decay]: T;
    private constructor(val: T) {
        this[decay] = val;
    }

    static of<U>(val: U): Right<U> {
        return new Right<U>(val);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(_: unknown, f: Unary<T, R>): R {
        return f(this[decay]);
    }
}

function either<A, B, C>(m1: Unary<C, B>, m2: Unary<A, B>, e: Either<C, A>): B {
    return e.either(m1, m2);
}

const functor = {
    [fmap]: <F extends Functional, _>(f: F, fa: Either<_, FirstParameter<F>>) =>
        (fa instanceof Left
            ? fa
            : Right.of(partialApply(f, fa[decay]))) as Either<
            _,
            PartialApplied<F>
        >,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [replace]: <A, B, _>(a: A, fb: Either<_, B>): Right<A> => Right.of(a)
};

const applicative = {
    ...functor,
    [pure]: Right.of,
    [tie]: <F extends Functional, _>(
        f: Either<_, F>,
        e: Either<_, FirstParameter<F>>
    ): Either<_, PartialApplied<F>> =>
        f instanceof Left ? f : applicative[fmap](f[decay], e),
    [rightTie]: right,
    [leftTie]: left
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const monad = {
    ...applicative,
    [bind]: <F extends FunctionalWithReturnType<Either<unknown, unknown>>, _>(
        f: F,
        ma: Either<_, FirstParameter<F>>
    ): PartialApplied<F> =>
        ma instanceof Left
            ? withSingularity(
                  partialApply(f, null),
                  ma as ReturnType<PartialApplied<F>>
              )
            : partialApply(f, ma[decay]),
    [compose]: right,
    [remit]: Right.of
};

export { Either, Left, Right, either, functor, applicative, monad };
