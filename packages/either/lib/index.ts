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
    defineTraverse,
    id,
    partial,
    proxied,
    swapped,
    take
} from '@hanshi/prelude';

type Either<A, B = unknown> = Left<A> | Right<B>;

class Left<T> {
    [a]: T;

    private constructor($: T) {
        this[a] = $;
    }

    static of<U>(val: U): Left<U> {
        return new Left<U>(val);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    either<R>(f: Unary<T, R>, _: unknown): R {
        return f(this[a]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    map<L, R>(f: Unary<T, L>, g: Unary<any, R>): Left<L> {
        return Left.of(f(this[a]));
    }

    dmap<R>(f: Unary<T, R>) {
        return f(this[a]);
    }
}

class Right<T> {
    [a]: T;

    private constructor($: T) {
        this[a] = $;
    }

    static of<U>(val: U): Right<U> {
        return new Right<U>(val);
    }

    either<R>(_: unknown, f: Unary<T, R>): R {
        return f(this[a]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    map<L, R>(f: Unary<any, L>, g: Unary<T, R>): Right<R> {
        return Right.of(g(this[a]));
    }

    dmap<R>(f: Unary<T, R>) {
        return f(this[a]);
    }
}

function either<A, B, C>(m1: Unary<C, B>, m2: Unary<A, B>, e: Either<C, A>): B {
    return e.either(m1, m2);
}

function isLeft<A>(e: Either<A, unknown>): e is Left<A> {
    return e instanceof Left;
}

function lefts<A>(es: Either<A, unknown>[]): A[] {
    return es.filter(isLeft).map((l) => l[a]);
}

function isRight<B>(e: Either<unknown, B>): e is Right<B> {
    return e instanceof Right;
}

function rights<A, B>(es: Either<A, B>[]): B[] {
    return es.filter(isRight).map((e) => e[a]);
}

function fromLeft<A>(defaulted: A, e: Either<A, unknown>): A {
    return e instanceof Left ? e[a] : defaulted;
}

function fromRight<B>(defaulted: B, e: Either<unknown, B>): B {
    return e instanceof Right ? e[a] : defaulted;
}

function partitionEithers<A, B>(es: Either<A, B>[]): [A[], B[]] {
    return es.reduce(
        ([ls, rs]: [A[], B[]], e) =>
            e instanceof Left ? [[...ls, e[a]], rs] : [ls, [...rs, e[a]]],
        [[], []]
    );
}

function fmap<F extends Functional, L = unknown>(
    f: F,
    e: Either<L, FirstParameter<F>>
): Either<L, PartialApplied<F>> {
    return e.map(id<L>, (r) => partial(f, r));
}

function v$<A, B, L>(a: A, fb: Either<L, B>): Either<L, A> {
    return fb instanceof Left ? fb : Right.of(a);
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
        : Right.of(partial(mf[a], ma[a]));
}

type EitherMap<A, Ts extends unknown[]> = Ts extends [infer Head, ...infer Tail]
    ? [Either<A, Head>, ...EitherMap<A, Tail>]
    : [];

type Lifted<A, F extends Functional> = (
    ...args: EitherMap<A, Parameters<F>>
) => Either<A, ReturnType<F>>;

const liftAN = <A, F extends Functional>(f: F): Lifted<A, F> =>
    proxied((target: F, args: EitherMap<A, Parameters<F>>) => {
        const foundLeft = args.find(isLeft);
        if (foundLeft !== undefined) return foundLeft;
        return Right.of(target(...args.map((e) => e[a])));
    }, f);

const rightTie: <A, B, L>(
    ma: Either<L, A>,
    mb: Either<L, B>
) => Either<L, B> = (ma, mb) => (ma instanceof Left ? ma : mb);

const leftTie: <A, B, L>(ma: Either<L, A>, mb: Either<L, B>) => Either<L, A> =
    swapped(rightTie);

const warp = <L, F extends Terminal<Either<L>>>(
    marg: Either<L, LastParameter<F>>,
    f: F
): ReversedPartialApplied<F> =>
    blindBind(
        proxied(
            (
                target: F,
                [, ...init]: [LastParameter<F>, ...Init<Parameters<F>>]
            ) =>
                (marg instanceof Left
                    ? marg
                    : target(
                          ...take(target.length - 1, init),
                          marg[a]
                      )) as ReturnType<F>,
            f
        )
    ) as ReversedPartialApplied<F>;

const insert = rightTie;

type FTA<L, TFA extends unknown[]> = TFA extends [infer Head, ...infer Tail]
    ? Head extends Either<L, infer R>
        ? [Head, FTA<L, Tail>]
        : never
    : [];

const sequenceA = <L, TFA extends Either<L>[]>(
    tfa: TFA
): Either<L, FTA<L, TFA>> => {
    for (const e of tfa) if (e instanceof Left) return e;
    return pure(tfa.map((e) => e[a])) as Either<L, FTA<L, TFA>>;
};

const traverse: <L, A, B>(
    f: Unary<A, Either<L, B>>,
    as: A[]
) => Either<L, B[]> = defineTraverse(arrayFmap, sequenceA);

export {
    Either,
    Left,
    Right,
    either,
    fmap,
    fromLeft,
    fromRight,
    insert,
    isLeft,
    isRight,
    leftTie,
    lefts,
    liftAN,
    partitionEithers,
    pure,
    rightTie,
    rights,
    sequenceA,
    tie,
    traverse,
    v$,
    warp
};
