import {
    FirstParameter,
    Functional,
    Init,
    LastParameter,
    PartialApplied,
    Terminal,
    Unary,
    blindBind,
    cons,
    partial,
    partialCurried,
    proxied,
    take
} from '@hanshi/prelude';

/**
 * fmap :: (a -> b) -> f a -> f b
 *
 * class Functor f where
 * A type f is a Functor if it provides a function fmap which,
 * given any types a and b lets you apply any function from (a -> b) to turn an f a into an f b,
 * preserving the structure of f. Furthermore f needs to adhere to the following
 * :
 *  * Identity:
 *    * fmap id == id
 *  * Composition:
 *    * fmap (f . g) == fmap f . fmap g
 *
 * @param f
 * @param pa
 * @returns
 */
function fmap<F extends Functional>(
    f: F,
    aa: FirstParameter<F>[]
): PartialApplied<F>[] {
    return aa.map((a) => partial(f, a));
}

/**
 *
 * @param a
 * @param pb
 * @returns
 */
const v$ = <A, B>(a: A, pb: B[]): A[] => pb.map(() => a);

/**
 * pure :: a -> f a
 *
 * class Functor f => Applicative f where
 * A functor with application, providing operations toembed pure expressions (pure),
 * and sequence computations and combine their results (<*> and liftA2).
 * A minimal complete definition must include implementations of pure and of either <*> or liftA2.
 * If it defines both, then they must behave the same as their default definitions
 * :
 *  * (<*>) = liftA2 id
 *  * liftA2 f x y = f <<$ x <*> y
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * pure id <*> v = v
 *  * Composition
 *    * pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
 *  * Homomorphism
 *    * pure f <*> pure x = pure (f x)
 *  * Interchange
 *    * u <*> pure y = pure ($ y) <*> u
 *
 * @param a
 * @returns
 */
const pure = <A>(a: A): [A] => [a];

/**
 * `<*>` :: f (a -> b) -> f a -> f b
 *
 * class Functor f => Applicative f where
 * A functor with application, providing operations toembed pure expressions (pure),
 * and sequence computations and combine their results (<*> and liftA2).
 * A minimal complete definition must include implementations of pure and of either <*> or liftA2.
 * If it defines both, then they must behave the same as their default definitions
 * :
 *  * (<*>) = liftA2 id
 *  * liftA2 f x y = f <<$ x <*> y
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * pure id <*> v = v
 *  * Composition
 *    * pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
 *  * Homomorphism
 *    * pure f <*> pure x = pure (f x)
 *  * Interchange
 *    * u <*> pure y = pure ($ y) <*> u
 *
 * @param pf
 * @param pa
 * @returns
 */
function tie<F extends Functional>(
    fs: F[],
    xs: FirstParameter<F>[]
): PartialApplied<F>[] {
    const fs_ = fs.map(partialCurried);
    return xs.flatMap((x) => fs_.map((f_) => f_(x)));
}

type ArrayMap<T extends unknown[]> = T extends [infer Head, ...infer Tail]
    ? [Head[], ...ArrayMap<Tail>]
    : [];

type Lifted<F extends Functional> = (
    ...args: ArrayMap<Parameters<F>>
) => ReturnType<F>[];

const liftAN = <F extends Functional>(f: F): Lifted<F> =>
    proxied(
        (target: F, args: ArrayMap<Parameters<F>>) =>
            args
                .reduce(
                    (prev: unknown[][], as: unknown[]) =>
                        prev.length === 0
                            ? as.map(pure)
                            : as.flatMap((a) => prev.map((p) => p.concat(a))),
                    []
                )
                .map((args) => target(...args)),
        f
    );

const rightTie = <A, B>(xs: A[], ys: B[]): B[] =>
    ys.flatMap((y) => xs.map(() => y));

const leftTie = <A, B>(xs: A[], ys: B[]): A[] => ys.flatMap(() => xs);

/**
 * `>>=` :: forall a b. m a -> (a -> m b) -> m b
 *
 * class Applicative m => Monad m where
 *
 * The Monad class defines the basic operations over a monad,
 * a concept from a branch of mathematics known as category theory.
 * From the perspective of a Haskell programmer, however,
 * it is best to think of a monad as an abstract datatype of actions.
 * Haskell's do expressions provide a convenient syntax for writing monadic expressions.
 *
 * Instances of Monad should satisfy the following
 * :
 *  * Left identity
 *    * return a >>= k = k a
 *  * Right identity
 *    * m >>= return = m
 *  * Associativity
 *    * m >>= (\x -> k x >>= h) = (m >>= k) >>= h
 *
 * Furthermore, the Monad and Applicative operations should relate as follows
 * :
 *  * pure = return
 *  * m1 <*> m2 = m1 >>= (\x1 -> m2 >>= (\x2 -> return (x1 x2)))
 *
 * The above laws imply
 * :
 *  * fmap f xs  =  xs >>= return . f
 *  * (>>) = (*>)
 *
 * and that pure and (<*>) satisfy the applicative functor laws.
 *
 * @param f
 * @param pa
 * @returns
 */
function warp<F extends Terminal<Array<unknown>>>(
    xs: LastParameter<F>[],
    f: F
): PartialApplied<F> {
    return blindBind(
        proxied(
            (
                target: F,
                [, ...init]: [LastParameter<F>, ...Init<Parameters<F>>]
            ) => xs.flatMap((x) => target(...take(f.length - 1, init), x)),
            f
        ) as F
    );
}

const insert = rightTie;

const remit = pure;

type FTA<TFA extends unknown[]> = TFA extends [infer AHead, ...infer Tail]
    ? AHead extends Array<infer Head>
        ? [Head, ...FTA<Tail>]
        : never
    : [];

function sequenceA<TFA extends unknown[]>(tfa: TFA): FTA<TFA>[] {
    if (tfa.length === 0) return [[] as FTA<TFA>];
    const [x, ...xs] = tfa;
    return tie(fmap(cons, x as unknown[]), sequenceA(xs)) as FTA<TFA>[];
}

const traverse: <A, B>(f: Unary<A, B[]>, as: A[]) => B[][] = (f, as) =>
    sequenceA(as.map(f));

export {
    fmap,
    insert,
    leftTie,
    liftAN,
    pure,
    remit,
    rightTie,
    sequenceA,
    tie,
    traverse,
    v$,
    warp
};
