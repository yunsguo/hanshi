import {
    FirstParameter,
    Functional,
    Init,
    LastParameter,
    PartialApplied,
    ReversedPartialApplied,
    Terminal,
    _,
    blindBind,
    left,
    partial,
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
    fa: Promise<Awaited<FirstParameter<F>>>
): Promise<PartialApplied<F>> {
    return fa.then((a) => partial<F>(f, a));
}

/**
 *
 * @param a
 * @param pb
 * @returns
 */
function v$<A, B>(a: A, pb: Promise<B>): Promise<A> {
    const rep = _(left<A, B>, a);
    return pb.then(rep, rep);
}

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
 *  * liftA2 f x y = f <$> x <*> y
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
const pure = <A>(a: A) => Promise.resolve(a);

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
 *  * liftA2 f x y = f <$> x <*> y
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
    pf: Promise<F>,
    pa: Promise<Awaited<FirstParameter<F>>>
): Promise<PartialApplied<F>> {
    return Promise.all([pf, pa]).then(([f, a]) => partial(f, a));
}

type PromiseMap<T extends unknown[]> = T extends [infer Head, ...infer Tail]
    ? [Promise<Head>, ...PromiseMap<Tail>]
    : [];

type Lifted<F extends Functional> = (
    ...args: PromiseMap<Parameters<F>>
) => Promise<ReturnType<F>>;

const liftAN = <F extends Functional>(f: F): Lifted<F> =>
    proxied(
        (target: F, args: PromiseMap<Parameters<F>>) =>
            Promise.all(args).then((as) => target(...(as as unknown[]))),
        f
    );

function rightTie<A, B>(fa: Promise<A>, fb: Promise<B>): Promise<B> {
    return fa.then(() => fb);
}

function leftTie<A, B>(fa: Promise<A>, fb: Promise<B>): Promise<A> {
    return fa.then((a) => fb.then(() => a));
}

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
function warp<F extends Terminal<Promise<unknown>>>(
    pa: Promise<Awaited<LastParameter<F>>>,
    f: F
): ReversedPartialApplied<F> {
    return blindBind(
        proxied(
            (
                target: F,
                [, ...init]: [Awaited<LastParameter<F>>, ...Init<Parameters<F>>]
            ) =>
                pa.then((last) =>
                    target(...take(f.length - 1, init), last)
                ) as ReturnType<F>,
            f
        )
    ) as ReversedPartialApplied<F>;
}

const insert = rightTie;

export { fmap, insert, leftTie, liftAN, pure, rightTie, tie, v$, warp };
