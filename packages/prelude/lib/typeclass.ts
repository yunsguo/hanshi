import { Binary, FirstParameter, Functional, left, PartialApplied, partialApply, right, Tenary, Unary } from './prelude';
import * as Symbol from './symbol';

interface Functor<T> extends Record<symbol, Functional> {
    [Symbol.fmap]: <A, B>(f: Unary<A, B>, fa: Functor<A>) => Functor<B>,
    [Symbol.replace]: <A, B>(a: A, fb: Functor<B>) => Functor<A>
};

class TypeClassError extends Error {

    constructor() {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TypeClassError);
        }

        this.name = "CustomError";
    }
}

/**
 * `<$>`
 * @param f
 * @param fa
 * @returns
 */
function fmap<A, B>(f: Unary<A, B>, fa: Functor<A>): Functor<B> {
    try {
        return fa[Symbol.fmap](f, fa);
    }
    catch (e) {
        throw e;
    }
}

/**
 * `<$`
 * @param a 
 * @param fb 
 * @returns 
 */
function replace<A, B>(a: A, fb: Functor<B>): Functor<A> {
    try {
        return fb[Symbol.replace](a, fb);
    }
    catch (e) {
        throw e;
    }
}

type MinimalCompleteDefinedFunctor<D> = D extends {
    [Symbol.fmap]: <A, B>(f: Unary<A, B>, fa: Functor<A>) => Functor<B>
} ? D : never;

function withCompliantFunctor<D extends Functor<unknown>>(def: MinimalCompleteDefinedFunctor<D>): D {
    const [_fmap, _replace] = [Symbol.fmap, Symbol.replace].map((s) => def[s]);
    if (_fmap !== undefined)
        return {
            ...def,
            [Symbol.fmap]: _fmap,
            [Symbol.replace]: _replace !== undefined ? _replace : (a, fb) => _fmap(partialApply(left, a), fb)
        };
    throw new Error();
}

interface Applicative<T> extends Functor<T> {
    [Symbol.pure]: <A>(a: A) => Applicative<A>,
    [Symbol.tie]: <F extends Functional>(fab: Applicative<F>, fa: Applicative<FirstParameter<F>>) => Applicative<PartialApplied<F>>,
    [Symbol.liftA2]: <A, B, C>(f: Binary<A, B, C>, fa: Applicative<A>, fb: Applicative<B>) => Applicative<C>,
    [Symbol.liftA3]: <A, B, C, D>(f: Tenary<A, B, C, D>, fa: Applicative<A>, fb: Applicative<B>, fc: Applicative<C>) => Applicative<D>,
    [Symbol.rightTie]: <A, B>(fa: Applicative<A>, fb: Applicative<B>) => Applicative<B>,
    [Symbol.leftTie]: <A, B>(fa: Applicative<A>, fb: Applicative<B>) => Applicative<A>,
}

function tie<F extends Functional>(fab: Applicative<F>, fa: Applicative<FirstParameter<F>>): Applicative<PartialApplied<F>> {
    try {
        return fab[Symbol.tie](fab, fa);
    }
    catch (e) {
        throw e;
    }
}

function liftA2<A, B, C>(f: Binary<A, B, C>, fa: Applicative<A>, fb: Applicative<B>): Applicative<C> {
    try {
        return fa[Symbol.liftA2](f, fa, fb);
    }
    catch (e) {
        throw e;
    }
}

function liftA3<A, B, C, D>(f: Tenary<A, B, C, D>, fa: Applicative<A>, fb: Applicative<B>, fc: Applicative<C>): Applicative<D> {
    try {
        return fa[Symbol.liftA3](f, fa, fb, fc);
    }
    catch (e) {
        throw e;
    }
}

/**
 * `<*`
 * @param fa 
 * @param fb 
 * @returns 
 * 
 */
function rightTie<A, B>(fa: Applicative<A>, fb: Applicative<B>): Applicative<B> {
    try {
        return fa[Symbol.rightTie](fa, fb);
    }
    catch (e) {
        throw e;
    }
}

/**
 * `*>`
 * @param fa 
 * @param fb 
 * @returns 
 */
function leftTie<A, B>(fa: Applicative<A>, fb: Applicative<B>): Applicative<A> {
    try {
        return fa[Symbol.leftTie](fa, fb);
    }
    catch (e) {
        throw e;
    }
}

type MinimalCompleteDefinedApplicative<D> = D extends { [Symbol.pure]: <A>(a: A) => Applicative<A> }
    ? D extends { [Symbol.tie]: <F extends Functional>(fab: Applicative<F>, fa: Applicative<FirstParameter<F>>) => Applicative<PartialApplied<F>> } ? D
    : D extends { [Symbol.liftA2]: <A, B, C>(f: Binary<A, B, C>, fa: Applicative<A>, fb: Applicative<B>) => Applicative<C> } ? D
    : never : never;

function withCompliantApplicative<D extends Functor<unknown>>(def: MinimalCompleteDefinedApplicative<D>): D {
    const
        [_pure, _tie, _liftA2, _liftA3, _rightTie, _leftTie, _fmap, _replace] =
            [Symbol.pure, Symbol.tie, Symbol.liftA2, Symbol.liftA3, Symbol.rightTie, Symbol.leftTie, Symbol.fmap, Symbol.replace].map((s) => def[s]);
    if (_pure !== undefined) {
        if (_tie !== undefined)
            return withRestDefinedApplicative({
                ...def,
                [Symbol.liftA2]: _liftA2 !== undefined ? _liftA2 : (f, fa, fb) => _tie(_tie(_pure(f), fa), fb),
                [Symbol.liftA3]: _liftA3 !== undefined ? _liftA3 : (f, fa, fb, fc) => _tie(_tie(_tie(_pure(f), fa), fb), fc)
            });
        if (_liftA2 !== undefined) {
            const __tie = partialApply(_liftA2, partialApply);
            return withRestDefinedApplicative({
                ...def,
                [Symbol.tie]: __tie,
                [Symbol.liftA3]: _liftA3 !== undefined ? _liftA3 : (f, fa, fb, fc) => __tie(__tie(__tie(_pure(f), fa), fb), fc)
            });
        }
    }
    throw new Error();
}

function withRestDefinedApplicative<D extends Functor<unknown>>(def: D): D {
    const
        [_liftA2, _rightTie, _leftTie, _fmap, _replace] =
            [Symbol.liftA2, Symbol.rightTie, Symbol.leftTie, Symbol.fmap, Symbol.replace].map((s) => def[s]);
    return {
        ...def,
        [Symbol.rightTie]: _rightTie !== undefined ? _rightTie : (fa, fb) => _liftA2(right, fa, fb),
        [Symbol.leftTie]: _leftTie !== undefined ? _leftTie : (fa, fb) => _fmap(partialApply(_replace, fa), fb)
    }
}

interface Monad<T> extends Applicative<T> {
    [Symbol.bind]: <F extends Functional, R>(f: F, ma: Monad<FirstParameter<F>>) => ReturnType<F> extends Monad<R> ? PartialApplied<F> : never,
    [Symbol.compose]: <A, B>(ma: Monad<A>, mb: Monad<B>) => Monad<B>,
    [Symbol.remit]: <A>(a: A) => Monad<A>
}

/**
 * `>>=`
 * @param f 
 * @param ma 
 * @returns 
 */
function bind<F extends Functional>(f: F, ma: Monad<FirstParameter<F>>): ReturnType<F> extends Monad<unknown> ? PartialApplied<F> : never {
    try {
        return ma[Symbol.bind](f, ma);
    }
    catch (e) {
        throw e;
    }
}

/**
 * `>>`
 * @param ma 
 * @param mb 
 * @returns 
 */
function compose<A, B>(ma: Monad<A>, mb: Monad<B>): Monad<B> {
    try {
        return ma[Symbol.compose](ma, mb);
    }
    catch (e) {
        throw e;
    }
}

type MinimalCompleteDefinedMonad<D> = D extends { [Symbol.bind]: <F extends Functional, R>(f: F, ma: Monad<FirstParameter<F>>) => ReturnType<F> extends Monad<R> ? PartialApplied<F> : never } ? D : never;

function withCompliantMonad<D extends Applicative<unknown>>(def: MinimalCompleteDefinedMonad<D>): D {
    const
        [_pure, _rightTie] =
            [Symbol.pure, Symbol.rightTie].map((s) => def[s]);
    if (_pure !== undefined && _rightTie !== undefined)
        return {
            ...def,
            [Symbol.remit]: _pure,
            [Symbol.compose]: _rightTie,
        };
    throw new Error();
}

export {
    Functor, fmap, replace, withCompliantFunctor, Applicative, tie, liftA2, liftA3, rightTie, leftTie, withCompliantApplicative, Monad, bind, compose, withCompliantMonad
}