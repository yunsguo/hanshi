import { Just, Maybe, Nothing, maybe, nothing } from '@hanshi/maybe';
import { FirstParameter, Unary, id } from '@hanshi/prelude';

function isEmpty<T>(a: T): boolean {
    switch (typeof a) {
        case 'undefined':
        case 'function':
        case 'symbol':
            return true;
        case 'string':
            return a.trim().length === 0;
        case 'number':
            return Number.isNaN(a);
        case 'object':
            if (a === null) return true;
            if (Array.isArray(a)) return a.every(isEmpty);
            return Object.entries(a).every((kv) => kv.some(isEmpty));
        default:
            return true;
    }
}

function get<F extends Unary>(
    f: F,
    a: FirstParameter<F>
): Maybe<ReturnType<F>> {
    try {
        const v = f(a);
        return isEmpty(v) ? nothing : Just.of(v);
    } catch (e) {
        console.debug(e);
        return nothing;
    }
}

const k = {
    a: { b: 2 },
    c: 'ok',
    empty: { a: '  ', b: NaN, c: [' ', NaN, {}], d: {} }
};

console.log(get((o) => o.d.a, k));

console.log(get((o) => o.a.b, k));

console.log(get((o) => o.empty, k));

console.log(
    maybe(
        'ok',
        id,
        get((o) => o.empty, k)
    )
);
