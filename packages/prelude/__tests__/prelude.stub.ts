import { curry, id, left, right, withSingularity } from '../lib/prelude';

function add(a: number, b: number, c: number, d: number) {
    return a + b + c + d;
}

describe('lib/prelude', () => {
    describe('curry', () => {
        it('should change its signature to a morphism', () => {
            const curried = curry(add);
            expect(curried(1)(2, 3, 4)).toBe(10);
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
            const addPrime = withSingularity<typeof add>(0);
            expect(addPrime(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addPrime(2, 3, 4, 5)).toBe(0);
            expect(addPrime(3, 4, 5, 6)).toBe(0);
        });
    });
});
