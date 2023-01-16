import { FirstParameter, Functional, partialApply } from './base';

function curry<F extends Functional>(f: F) {
    return (arg: FirstParameter<F>) => partialApply(f, arg);
}

function id<T>(x: T): T {
    return x;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function left<A, B>(a: A, _: B): A {
    return a;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function right<A, B>(_: A, b: B): B {
    return b;
}

function withSingularity<F extends Functional>(r: ReturnType<F>): F {
    return new Proxy(withSingularity, {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        apply: (target, thisArg, argumentsList) => r
    }) as F;
}

export { curry, id, left, right, withSingularity };
