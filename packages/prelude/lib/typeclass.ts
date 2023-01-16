/* eslint-disable no-useless-catch */
import {
    Binary,
    FirstParameter,
    Functional,
    PartialApplied,
    partialApply,
    Unary
} from './base';
import { left, right } from './prelude';
import * as Typeclass from './typeclass-symbol';

interface FunctorTrait {
    /**
     * `<$>`
     * @param ab
     * @param a
     * @returns
     */
    fmap: <A, B>(f: Unary<A, B>, fa: Functor<A>) => Functor<B>;
    /**
     * `<$`
     * @param a
     * @param fb
     * @returns
     */
    replace: <A, B>(a: A, fb: Functor<B>) => Functor<A>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
interface Functor<T> {
}

class TypeClassError extends Error {
    constructor() {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super();
        Error.captureStackTrace(this, TypeClassError);

        this.name = 'TypeClassError';
    }
}

function withCompliantFunctor<D extends Record<string, Functional>>(
    def: D
): FunctorTrait {
    const [fmap, _replace] = ['fmap', 'replace'].map((s) => def[s]);
    if (fmap === undefined) throw new Error();
    return {
        ...def,
        fmap,
        replace:
            _replace !== undefined
                ? _replace
                : (a, fb) => fmap(partialApply(left, a), fb)
    };
}

interface ApplicativeTrait {
    pure: <A>(a: A) => Applicative<A>;
    tie: <F extends Functional>(
        fab: Applicative<F>,
        fa: Applicative<FirstParameter<F>>
    ) => Applicative<PartialApplied<F>>;
    liftA2: <A, B, C>(
        f: Binary<A, B, C>,
        fa: Applicative<A>,
        fb: Applicative<B>
    ) => Applicative<C>;
    liftAN: <F extends Functional>(
        f: F,
        fargs: Applicative<Parameters<F>>
    ) => Applicative<ReturnType<F>>;
    rightTie: <A, B>(fa: Applicative<A>, fb: Applicative<B>) => Applicative<B>;
    leftTie: <A, B>(fa: Applicative<A>, fb: Applicative<B>) => Applicative<A>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Applicative<A> extends Functor<A> {
}

function withCompliantApplicative<D extends Record<string, Functional>>(
    def: D
): ApplicativeTrait {
    const [pure, _tie, _liftA2, _rightTie, _leftTie, _fmap, _replace, _liftAN] =
        [
            'pure',
            'tie',
            'liftA2',
            'rightTie',
            'leftTie',
            'fmap',
            'replace',
            'liftAN'
        ].map((s) => def[s]);
    if (pure === undefined) throw new Error();
    if (_tie !== undefined) {
        const __liftA2: ApplicativeTrait['liftA2'] =
            _liftA2 !== undefined
                ? _liftA2
                : (f, fa, fb) => _tie(_tie(pure(f), fa), fb);
        return {
            ...def,
            pure,
            tie: _tie,
            liftA2: __liftA2,
            liftAN:
                _liftAN !== undefined
                    ? _liftAN
                    : partialApply(partialApply(liftANImpl, pure), _tie),
            rightTie:
                _rightTie !== undefined
                    ? _rightTie
                    : (fa, fb) => liftA2(right, fa, fb),
            leftTie:
                _leftTie !== undefined
                    ? _leftTie
                    : (fa, fb) => _fmap(partialApply(_replace, fa), fb)
        };
    }
    if (_liftA2 !== undefined) {
        const __tie = partialApply(_liftA2, partialApply);
        return {
            ...def,
            pure,
            tie: __tie,
            liftA2: _liftA2,
            liftAN:
                _liftAN !== undefined
                    ? _liftAN
                    : partialApply(partialApply(liftANImpl, pure), __tie),
            rightTie:
                _rightTie !== undefined
                    ? _rightTie
                    : (fa, fb) => _liftA2(right, fa, fb),
            leftTie:
                _leftTie !== undefined
                    ? _leftTie
                    : (fa, fb) => _fmap(partialApply(_replace, fa), fb)
        };
    }
    throw new Error();
}

type Bound<F extends Functional> = ReturnType<F> extends Monad<unknown>
    ? PartialApplied<F>
    : never;

interface MonadTrait {
    bind: <F extends Functional>(
        f: F,
        ma: Monad<FirstParameter<F>>
    ) => Bound<F>;
    compose: <A, B>(ma: Monad<A>, mb: Monad<B>) => Monad<B>;
    remit: <A>(a: A) => Monad<A>;
}

interface Monad<T> extends Applicative<T> {
    [Typeclass.monad]: MonadTrait;
}

/**
 * `(>>=) :: forall a b. m a -> (a -> m b) -> m b`
 *
 * If the return type evaluate to `never`, it means the parameter `f` is not monadically applicable.
 * @param f
 * @param ma
 * @returns
 */
function bind<F extends Functional>(
    f: F,
    ma: Monad<FirstParameter<F>>
): Bound<F> {
    try {
        return ma[Typeclass.monad].bind(f, ma);
    } catch (e) {
        throw e;
    }
}

/**
 * `(>>) :: forall a b. m a -> m b -> m b`
 * @param ma
 * @param mb
 * @returns
 */
function compose<A, B>(ma: Monad<A>, mb: Monad<B>): Monad<B> {
    try {
        return ma[Typeclass.monad].compose(ma, mb);
    } catch (e) {
        throw e;
    }
}

function withCompliantMonad<D extends Record<string, Functional>>(
    def: D,
    applicativeTrait: ApplicativeTrait
): MonadTrait {
    const [_remit, _compose, bind] = ['remit', 'compose', 'bind'].map(
        (s) => def[s]
    );
    if (bind === undefined) throw new Error();
    return {
        ...def,
        bind,
        remit: _remit !== undefined ? _remit : applicativeTrait.pure,
        compose: _compose !== undefined ? _compose : applicativeTrait.rightTie
    };
}

export {
    TypeClassError,
    Functor,
    FunctorTrait,
    fmap,
    replace,
    withCompliantFunctor,
    Applicative,
    ApplicativeTrait,
    tie,
    liftA2,
    liftAN,
    rightTie,
    leftTie,
    withCompliantApplicative,
    Monad,
    MonadTrait,
    bind,
    compose,
    withCompliantMonad
};
