import { partialApply, curry, id, left, withSingularity } from '../lib/prelude';

function add(a: number, b: number, c: number, d: number) {
    return a + b + c + d;
}

describe('lib/prelude', () => {
    describe('partialApply', () => {
        it('should bind a function and change its signature', () => {
            const ba1 = partialApply(add, 1);

            const ba2 = partialApply(ba1, 2);

            const ba3 = partialApply(ba2, 3);

            const ba4 = partialApply(ba3, 4);

            expect(ba1(1, 2, 3)).toBe(7);
            expect(ba2(4, 5)).toBe(12);
            expect(ba3(6)).toBe(12);
            expect(ba4).toBe(10);
        });
    });
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
            expect(left(1, 2)).toBe(1);
        });
    });
    describe('withSingularity', () => {
        it('should return a singularity function that always return the supplied result', () => {
            const addPrime = withSingularity(add, 0);
            expect(addPrime(1, 2, 3, 4)).not.toBe(add(1, 2, 3, 4));
            expect(addPrime(2, 3, 4, 5)).toBe(0);
            expect(addPrime(3, 4, 5, 6)).toBe(0);
        });
    });
});
