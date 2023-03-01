import {
    FirstParameter,
    Functional,
    MonadicAction,
    PartialApplied,
    Unary,
    blindBind,
    id,
    left,
    modified,
    partial,
    right
} from '@hanshi/prelude';

type Either<A, B> = Left<A> | Right<B>;

class Left<T> {
    private constructor(private $: T) {}

    static of<U>(val: U): Left<U> {
        return new Left<U>(val);
    }

    public get a(): T {
        return this.$;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(f: Unary<T, R>, _: unknown): R {
        return f(this.$);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    map<L, R>(f: Unary<T, L>, g: Unary<any, R>): Left<L> {
        return Left.of(f(this.$));
    }
}

class Right<T> {
    private constructor(private $: T) {}

    static of<U>(val: U): Right<U> {
        return new Right<U>(val);
    }

    public get a(): T {
        return this.$;
    }

    either<R>(_: unknown, f: Unary<T, R>): R {
        return f(this.$);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    map<L, R>(f: Unary<any, L>, g: Unary<T, R>): Right<R> {
        return Right.of(g(this.$));
    }
}

function either<A, B, C>(m1: Unary<C, B>, m2: Unary<A, B>, e: Either<C, A>): B {
    return e.either(m1, m2);
}

function isLeft<A>(e: Either<A, unknown>): e is Left<A> {
    return e instanceof Left;
}

function lefts<A>(es: Either<A, unknown>[]): A[] {
    return es.filter(isLeft).map((l) => l.a);
}

function isRight<B>(e: Either<unknown, B>): e is Right<B> {
    return e instanceof Right;
}

function rights<A, B>(es: Either<A, B>[]): B[] {
    return es.filter(isRight).map((e) => e.a);
}

function fromLeft<A>(a: A, e: Either<A, unknown>): A {
    return e instanceof Left ? e.a : a;
}

function fromRight<B>(b: B, e: Either<unknown, B>): B {
    return e instanceof Right ? e.a : b;
}

function partitionEithers<A, B>(es: Either<A, B>[]): [A[], B[]] {
    return es.reduce(
        ([ls, rs]: [A[], B[]], e) =>
            e instanceof Left ? [[...ls, e.a], rs] : [ls, [...rs, e.a]],
        [[], []]
    );
}

function fmap<F extends Functional, L = unknown>(
    f: F,
    e: Either<L, FirstParameter<F>>
): Either<L, PartialApplied<F>> {
    return e.map(id<L>, (r) => partial(f, r));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function replace<A, B, L>(a: A, fb: Either<L, B>): Either<L, A> {
    return Right.of(a);
}

const pure = Right.of;

function tie<F extends Functional, L>(
    mf: Either<L, F>,
    ma: Either<L, FirstParameter<F>>
): Either<L, PartialApplied<F>> {
    return mf instanceof Left
        ? mf
        : ma instanceof Left
        ? ma
        : Right.of(partial(mf.a, ma.a));
}

const rightTie: <A, B, L>(ma: Either<L, A>, mb: Either<L, B>) => Either<L, B> =
    right;

const leftTie: <A, B, L>(ma: Either<L, A>, mb: Either<L, B>) => Either<L, A> =
    left;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compose<L, F extends MonadicAction<Either<L, any>>>(
    f: F,
    pa: Either<L, FirstParameter<F>>
): PartialApplied<F> {
    return blindBind(
        modified(
            (target, thisArg, [, ...args]) =>
                pa instanceof Left ? pa : target(pa.a, ...args),
            f
        ) as F
    );
}

const rightCompose: typeof rightTie = right;

const leftCompose: typeof leftTie = left;

export {
    Either,
    Left,
    Right,
    either,
    isLeft,
    lefts,
    isRight,
    rights,
    fromLeft,
    fromRight,
    partitionEithers,
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
