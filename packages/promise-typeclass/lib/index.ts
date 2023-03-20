import {
    FirstParameter,
    Functional,
    Init,
    LastParameter,
    PartialApplied,
    ReversedPartialApplied,
    Terminal,
    Unary,
    _,
    blindBind,
    left,
    partial,
    proxied,
    take
} from '@hanshi/prelude';

/**
 * fmap is used to apply a function of type ((a:A) => B) to a value of type f A, where F is a functor, to produce a value of type F<B>. Note that for any type constructor with more than one parameter (e.g., Either), only the last type parameter can be modified with fmap (e.g., B in `Either<A,B>`). Notice ((a:A) => B) may be a curried function, but doesn't have to be.
 *
 * class Functor F where
 *
 * A type F is a Functor if it provides a function `fmap` which, given any types A and B lets you apply any function from ((a:A) => B) to turn an F<A> into an F<B>, preserving the structure of F. Furthermore F needs to adhere to the following
 * :
 *  * Identity:
 *    * `fmap(id, a) === id(a)`
 *  * Composition:
 *    * `fmap(chain(f, g), a) === chain(_(fmap, f), _(fmap, g))(a)`
 * @param f
 * @param pa
 * @returns
 */
const fmap = <F extends Functional>(
    f: F,
    fa: Promise<Awaited<FirstParameter<F>>>
): Promise<PartialApplied<F>> => fa.then((a) => partial<F>(f, a));

/**
 * Replace all locations in the input with the same value. The default definition is `(a, fb) =>
    fmap(_(left, a), fb)`, but this may be overridden with a more efficient version.
 * @param a
 * @param pb
 * @returns
 */
function v$<A, B>(a: A, pb: Promise<B>): Promise<A> {
    const rep = _(left<A, B>, a);
    return pb.then(rep, rep);
}

/**
 * Lift a value.
 *
 * class Functor F => Applicative F where
 *
 * A functor with application, providing operations toembed pure expressions (`pure`), and sequence computations and combine their results (`<*>`(tie) and `liftAN`).
 *
 * A minimal complete definition must include implementations of `pure` and of either `<*>`(tie) or `liftAN`. If it defines both, then they must behave the same as their default definitions
 * :
 *  * `tie === (ff, fa) => liftAN(_)(ff, fa)`
 *  * `liftAN(f)(x, y) === tie(fmap(f, x), y)`
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * `tie(pure(id), v) === v`
 *  * Composition
 *    * `tie(tie(tie(pure(chain), u), v), w) (.) === tie(u, tie(v, w)`
 *  * Homomorphism
 *    * `tie(pure(f), pure(x)) === pure(f(x))`
 *  * Interchange
 *    * `tie(u, pure(y)) === tie(pure(f=>f(y)), u)`
 *
 * @param a
 * @returns
 */
const pure = <A>(a: A) => Promise.resolve(a);

/**
 * Sequential application.
 *
 * class Functor F => Applicative F where
 *
 * A functor with application, providing operations toembed pure expressions (`pure`), and sequence computations and combine their results (`<*>`(tie) and `liftAN`).
 *
 * A minimal complete definition must include implementations of `pure` and of either `<*>`(tie) or `liftAN`. If it defines both, then they must behave the same as their default definitions
 * :
 *  * `tie === (ff, fa) => liftAN(_)(ff, fa)`
 *  * `liftAN(f)(x, y) === tie(fmap(f, x), y)`
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * `tie(pure(id), v) === v`
 *  * Composition
 *    * `tie(tie(tie(pure(chain), u), v), w) (.) === tie(u, tie(v, w)`
 *  * Homomorphism
 *    * `tie(pure(f), pure(x)) === pure(f(x))`
 *  * Interchange
 *    * `tie(u, pure(y)) === tie(pure(f=>f(y)), u)`
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

/**
 * Lift a nth arity function to actions.
 *
 * class Functor F => Applicative F where
 *
 * A functor with application, providing operations toembed pure expressions (`pure`), and sequence computations and combine their results (`<*>`(tie) and `liftAN`).
 *
 * A minimal complete definition must include implementations of `pure` and of either `<*>`(tie) or `liftAN`. If it defines both, then they must behave the same as their default definitions
 * :
 *  * `tie === (ff, fa) => liftAN(_)(ff, fa)`
 *  * `liftAN(f)(x, y) === tie(fmap(f, x), y)`
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * `tie(pure(id), v) === v`
 *  * Composition
 *    * `tie(tie(tie(pure(chain), u), v), w) (.) === tie(u, tie(v, w)`
 *  * Homomorphism
 *    * `tie(pure(f), pure(x)) === pure(f(x))`
 *  * Interchange
 *    * `tie(u, pure(y)) === tie(pure(f=>f(y)), u)`
 *
 * The other methods have the following default definitions, which may be overridden with equivalent specialized implementations
 * :
 * * u *> v = (id <$ u) <*> v
 * * u <* v = liftA2 const u v
 *
 * As a consequence of these laws, the Functor instance for f will satisfy
 * * fmap f x = pure f <*> x
 *
 * It may be useful to note that supposing
 * * forall x y. p (q x y) = f x . g y
 *
 * it follows from the above that
 * * liftA2 p (liftA2 q u v) = liftA2 f u . liftA2 g v
 *
 * If f is also a Monad, it should satisfy
 * :
 * * pure = return
 * * m1 <*> m2 = m1 >>= (\x1 -> m2 >>= (\x2 -> return (x1 x2)))
 * * (*>) = (>>)
 *
 * (which implies that pure and <*> satisfy the applicative functor laws).
 *
 * Minimal complete definition
 * :
 * * pure, (tie | liftAN)
 * @param f
 * @returns
 */
const liftAN = <F extends Functional>(f: F): Lifted<F> =>
    proxied(
        (target: F, args: PromiseMap<Parameters<F>>) =>
            Promise.all(args).then((as) => target(...(as as unknown[]))),
        f
    );

/**
 * Sequence actions, discarding the value of the first argument.
 *
 * class Functor F => Applicative F where
 *
 * A functor with application, providing operations toembed pure expressions (`pure`), and sequence computations and combine their results (`<*>`(tie) and `liftAN`).
 *
 * A minimal complete definition must include implementations of `pure` and of either `<*>`(tie) or `liftAN`. If it defines both, then they must behave the same as their default definitions
 * :
 *  * `tie === (ff, fa) => liftAN(_)(ff, fa)`
 *  * `liftAN(f)(x, y) === tie(fmap(f, x), y)`
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * `tie(pure(id), v) === v`
 *  * Composition
 *    * `tie(tie(tie(pure(chain), u), v), w) (.) === tie(u, tie(v, w)`
 *  * Homomorphism
 *    * `tie(pure(f), pure(x)) === pure(f(x))`
 *  * Interchange
 *    * `tie(u, pure(y)) === tie(pure(f=>f(y)), u)`
 * @param fa
 * @param fb
 * @returns
 */
const rightTie = <A, B>(fa: Promise<A>, fb: Promise<B>): Promise<B> =>
    fa.then(() => fb);

/**
 * Sequence actions, discarding the value of the second argument.
 *
 * class Functor F => Applicative F where
 *
 * A functor with application, providing operations toembed pure expressions (`pure`), and sequence computations and combine their results (`<*>`(tie) and `liftAN`).
 *
 * A minimal complete definition must include implementations of `pure` and of either `<*>`(tie) or `liftAN`. If it defines both, then they must behave the same as their default definitions
 * :
 *  * `tie === (ff, fa) => liftAN(_)(ff, fa)`
 *  * `liftAN(f)(x, y) === tie(fmap(f, x), y)`
 *
 * Further, any definition must satisfy the following
 * :
 *  * Identity
 *    * `tie(pure(id), v) === v`
 *  * Composition
 *    * `tie(tie(tie(pure(chain), u), v), w) (.) === tie(u, tie(v, w)`
 *  * Homomorphism
 *    * `tie(pure(f), pure(x)) === pure(f(x))`
 *  * Interchange
 *    * `tie(u, pure(y)) === tie(pure(f=>f(y)), u)`
 * @param fa
 * @param fb
 * @returns
 */
const leftTie = <A, B>(fa: Promise<A>, fb: Promise<B>): Promise<A> =>
    fa.then((a) => fb.then(() => a));

/**
 * `>>=` :: forall a b. m a -> (a -> m b) -> m b
 * Sequentially compose two actions, passing any value produced by the first as an argument to the second.
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

type AwaitedMap<PA extends unknown[]> = PA extends [infer Head, ...infer Tail]
    ? [Awaited<Head>, ...AwaitedMap<Tail>]
    : [];

const sequenceA = <TFA extends Promise<unknown>[]>(
    tfa: TFA
): Promise<AwaitedMap<TFA>> => Promise.all(tfa) as Promise<AwaitedMap<TFA>>;

const traverse = <A, B>(f: Unary<A, Promise<B>>, as: A[]): Promise<B[]> =>
    Promise.all(as.map(f));

export {
    fmap,
    insert,
    leftTie,
    liftAN,
    pure,
    rightTie,
    tie,
    v$,
    warp,
    sequenceA,
    traverse
};
