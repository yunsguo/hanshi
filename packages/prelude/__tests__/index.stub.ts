import {
    Binary,
    blindBind,
    chain,
    cons,
    curry,
    id,
    init,
    left,
    partial,
    partialN,
    right,
    swapped,
    take,
    unspreaded,
    withConstant
} from '../lib';

function add(a: number, b: number, c: number, d: number) {
    return a + b + c + d;
}

describe('lib/prelude', () => {
    describe('blindBind', () => {
        function countUndefined(
            a: unknown,
            b: unknown,
            c: unknown,
            d: unknown
        ): number {
            return [a, b, c, d].filter((e) => e === undefined).length;
        }
        it('should bind a function with undefined and change its signature', () => {
            const bc1 = blindBind(countUndefined);
            expect(bc1(1, 2, 3)).toBe(1);

            const bc2 = blindBind(bc1);
            expect(bc2(4, 5)).toBe(2);

            const bc3 = blindBind(bc2);
            expect(bc3(6)).toBe(3);

            const bc4 = blindBind(bc3);
            expect(bc4).toBe(4);
        });
        it('should throw with a spread function', () => {
            const f: Binary<number, number, number> = (...args: number[]) =>
                args.length;
            expect(() => blindBind(f)).toThrow();
        });
    });
    const inc = (a: number) => a + 1;
    describe('partial', () => {
        it('should bind a function and change its signature', () => {
            const ba1 = partial(add, 1);
            expect(ba1(1, 2, 3)).toBe(7);

            const ba2 = partial(ba1, 2);
            expect(ba2(4, 5)).toBe(12);

            const ba3 = partial(ba2, 3);
            expect(ba3(6)).toBe(12);

            const ba4 = partial(ba3, 4);
            expect(ba4).toBe(10);

            const bi = partial(inc, 5);
            expect(bi).toBe(6);
        });
        it('should throw with a spread function', () => {
            const f: Binary<number, number, number> = (...args: number[]) =>
                args.length;
            expect(() => partial(f, 5)).toThrow();
        });
    });
    describe('partialN', () => {
        it('should bind a function and change its signature', () => {
            const ba1 = partialN(add, [1, 2]);
            expect(ba1(3, 4)).toBe(10);

            const ba2 = partialN(ba1, [3]);
            expect(ba2(4)).toBe(10);

            const ba3 = partialN(ba2, [4]);
            expect(ba3).toBe(10);

            const a = (a: number, b: number) => a + b;
            partialN(a, [5]);
        });
        it('should throw with a spread function', () => {
            const f: Binary<number, number, number> = (...args: number[]) =>
                args.length;
            expect(() => partialN(f, [5, 6])).toThrow();
        });
    });
    describe('curry', () => {
        it('should change its signature to a morphism', () => {
            const curried = curry(add);
            expect(curried(1)(2)(3)(4)).toBe(10);
        });
        it('should throw with a spread function', () => {
            const f: Binary<number, number, number> = (...args: number[]) =>
                args.length;
            expect(() => curry(f)).toThrow();
        });
    });
    describe('id', () => {
        it('should be identity', () => {
            const tests = [1, 2, [], {}, 'string'];
            expect(tests.map(id)).toEqual(tests);
        });
    });
    describe('left', () => {
        it('should return the first argument', () => {
            const fixed = Math.random();
            expect(left(fixed, 2)).toBe(fixed);
        });
    });
    describe('right', () => {
        it('should return the second argument', () => {
            const fixed = Math.random();
            expect(right(1, fixed)).toBe(fixed);
        });
    });
    describe('withConstant', () => {
        it('should return a constant function that always return the supplied result', () => {
            const addPrime = withConstant(add, 0);
            expect(addPrime(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addPrime(2, 3, 4, 5)).toBe(0);
            expect(addPrime(3, 4, 5, 6)).toBe(0);
        });
    });
    describe('chain', () => {
        it('should return a function that chains two functions together', () => {
            const addInc = chain(inc, add);
            expect(addInc(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addInc(2, 3, 4, 5)).toBe(15);
            expect(addInc(3, 4, 5, 6)).toBe(19);
            const addString = chain((x) => JSON.stringify(x), add);
            expect(addString(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addString(2, 3, 4, 5)).toBe('14');
        });
    });
    describe('swapped', () => {
        const liner = (a: number, b: number) => a * 7 + b;
        it('should return a function that swap the two parameters', () => {
            const [a, b] = [...Array(2).keys()].map(() => Math.random());
            expect(swapped(liner)(a, b)).toStrictEqual(liner(b, a));
        });
    });
    describe('cons', () => {
        it('should return an array with head and tail in the proper place', () => {
            expect(cons(5, [1, 2, 3])).toStrictEqual([5, 1, 2, 3]);
            expect(cons(5, [])).toStrictEqual([5]);
        });
    });
    describe('unspread', () => {
        it('should return function as if its arguments were consolidated into a single array', () => {
            expect(unspreaded(add)([1, 2, 3, 4])).toBe(10);
            expect(unspreaded(add)([7, 8, 9, 0])).toBe(24);
        });
    });
    describe('init', () => {
        it('should return everything except the last element of the stream', () => {
            expect(init([1, 2, 3, 4])).toStrictEqual([1, 2, 3]);
            expect(init([7, 8, 9, 0])).toStrictEqual([7, 8, 9]);
            expect(init([])).toStrictEqual([]);
        });
    });
    describe('take', () => {
        it('should take items from provided list by given number', () => {
            expect(take(3, [1, 2, 3, 4])).toStrictEqual([1, 2, 3]);
            expect(take(2, [7, 8, 9, 0])).toStrictEqual([7, 8]);
            expect(take(-1, [])).toStrictEqual([]);
        });
    });
});
