import {
    FirstParameter,
    Unary,
    checkWithError,
    partial
} from '@hanshi/prelude';

/**
 * A unique symbol representing the type trait field.
 */
const decay: unique symbol = Symbol();

/**
 * DmapDecayableError is thrown when any error is thrown within dmap operation.
 */
class DmapDecayableError<T> extends Error {
    constructor(private d: T, private original?: Error) {
        super(`Are you sure ${JSON.stringify(d)} is of typeclass decayable?`);

        this.name = this.constructor.name;

        Object.setPrototypeOf(this, DmapDecayableError.prototype);

        Error.captureStackTrace(this, DmapDecayableError); // capture stack trace of the custom error
        if (original && original.stack) {
            // append stack trace of original error
            this.stack += `\nCaused by: ${original.stack}`;
        }
    }
}

/**
 * Extract decayable using a unary function from a given value
 * @param f the unary function
 * @param d any value that is a decayable
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dmap = <F extends Unary>(f: F, d: any) => {
    try {
        checkWithError(
            d,
            (d) => ['function', 'object'].every((t) => typeof d !== t),
            () => new DmapDecayableError(d)
        );
        return partial(f, (d as { [decay]: FirstParameter<F> })[decay]);
    } catch (e) {
        if (
            e instanceof Error &&
            (/.*Cannot read properties of.*/.test(e.message) ||
                /.*undefined.*/.test(e.message))
        )
            throw new DmapDecayableError(d, e);
        else throw e;
    }
};

export { decay, dmap };
