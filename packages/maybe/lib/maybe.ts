import { decay, Unary } from '@hanshi/prelude';

class Nothing {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    maybe<B>(b: B, f: Unary<any, B>): B {
        return b;
    }
}
const nothing = new Nothing();

class Just<T> {
    [decay]: T;
    constructor(val: T) {
        this[decay] = val;
    }

    static of<U>(a: U) {
        return new Just<U>(a);
    }

    maybe<B>(b: B, f: Unary<T, B>): B {
        return f(this[decay]);
    }
}

type Maybe<A> = Nothing | Just<A>;

function maybe<A, B>(b: B, f: Unary<A, B>, ma: Maybe<A>): B {
    return ma.maybe(b, f);
}

export { Nothing, nothing, Just, maybe };
