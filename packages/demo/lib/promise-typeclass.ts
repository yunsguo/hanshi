import {
    warp as warpPromise,
    fmap as fmapPromise,
    liftAN as liftANPromise
} from '@hanshi/promise-typeclass';

// import { PromiseTypeclass as pt } from 'hanshi'; // or import as a namespace and refer as `pt.warp`.

// const { warp: warpPromise, fmap: fmapPromise, liftAN: liftANPromise } = pt; // or destruct and rename.

const waitedValue = <T>(v: T, t: number): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(v), t));

const terminalWithPromise = (a: number): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(a + 5), 500));

const waited1sNumber10 = warpPromise(waitedValue(5, 500), terminalWithPromise); // For any function that returns a promise, warp(or `>>=` in `haskell) can `partial apply` a promise as if it's normal(awaited), and **return as usual**.

function display<T>(n: T) {
    console.log('value', n);
}

fmapPromise(display, waited1sNumber10); // For any function(terminated with a promise or not), `fmap` can apply a promise instead of the normal(awaited), but **returns a Promise of the value as result**.

// The function `display` does not return anything, so technically it now returns a Promise<void>.

// The side effect of promises are also retained by `fmap`. For instance this `display` invocation will wait for 1 second in the scheduler.

const terminalWithPromise2 = (a: number, b: string): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(b.length + a), 2000));

const waited4sNumber20 = warpPromise(
    waitedValue(10, 1000),
    warpPromise(waitedValue('abcdefghji', 1000), terminalWithPromise2)
); // Due to the fact that `monad` has associativity, `warp` operation works in a reverse order from `partial application`.

fmapPromise(display, waited4sNumber20); // This `display` invocation will wait for 4 seconds in the scheduler, since all the side effects are retained.

const noneTerminal = (name: string, value: object): string =>
    name + JSON.stringify(value);

const liftedNoneTerminal = liftANPromise(noneTerminal); // `LiftAN` takes a function and returns a version of it that all parameters and the return value are promises.

fmapPromise(
    display,
    liftedNoneTerminal(
        waitedValue('waited name', 1500),
        waitedValue({ sample: 1 }, 1500)
    )
); // This `display` invocation will wait for 3 seconds in the scheduler, since all the side effects are retained.
