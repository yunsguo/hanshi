/**
 * `<$>`
 */
const fmap: unique symbol = Symbol.for('Functor.fmap');

/**
 * `<$`
 */
const replace: unique symbol = Symbol.for('Functor.<$');

const pure: unique symbol = Symbol.for('Applicable.pure');

/**
 * `<*>`
 */
const tie: unique symbol = Symbol.for('Applicable.<*>');

const liftA2: unique symbol = Symbol.for('Applicable.liftA2');

const liftA3: unique symbol = Symbol.for('Applicable.liftA3');

/**
 * `<*`
 */
const rightTie: unique symbol = Symbol.for('Applicable.*>');

/**
 * `*>`
 */
const leftTie: unique symbol = Symbol.for('Applicable.<*');

/**
 * `>>=`
 */
const bind: unique symbol = Symbol.for('Monad.>>=');

/**
 * `>>`
 */
const compose: unique symbol = Symbol.for('Monad.>>');

const remit: unique symbol = Symbol.for('Monad.return');

const decay: unique symbol = Symbol.for('Newtype.decay');

export {
    fmap,
    replace,
    pure,
    tie,
    liftA2,
    liftA3,
    rightTie,
    leftTie,
    bind,
    compose,
    remit,
    decay
};
