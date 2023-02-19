import {
    Binary,
    curry,
    defaultedFailable,
    failable,
    id,
    left,
    partial,
    partialN,
    right,
    withConstant
} from '../lib/prelude';

function add(a: number, b: number, c: number, d: number) {
    return a + b + c + d;
}

describe('lib/prelude', () => {
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
        });
        it('should throw with a spread function', () => {
            const f: Binary<number, number, number> = (...args: number[]) =>
                args.length;
            expect(() => partial(f, 5)).toThrow();
        });
    });
    describe('failable', () => {
        function test(a: number): number {
            if (a % 2 === 0) throw a;
            return a;
        }
        const ft = failable(test);
        it('should silence error', () => {
            expect(ft(2)).toBe(undefined);
            expect(ft(3)).toBe(3);
        });
    });
    describe('defaultedFailable', () => {
        function test(a: number): number {
            if (a % 2 === 0) throw a;
            return a;
        }
        const ft = defaultedFailable(test, undefined);
        it('should silence error', () => {
            expect(ft(2)).toBe(undefined);
            expect(ft(3)).toBe(3);
        });
        it('should return with given value', () => {
            const d = 6;
            expect(defaultedFailable(test, d)(6)).toBe(d);
            expect(defaultedFailable(test, d)(5)).toBe(5);
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
            expect(curried(1)(2, 3, 4)).toBe(10);
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
    describe('withSingularity', () => {
        it('should return a singularity function that always return the supplied result', () => {
            const addPrime = withConstant(add, 0);
            expect(addPrime(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addPrime(2, 3, 4, 5)).toBe(0);
            expect(addPrime(3, 4, 5, 6)).toBe(0);
        });
    });
});
