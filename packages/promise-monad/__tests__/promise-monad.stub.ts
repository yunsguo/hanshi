import {
    compose as comp,
    fmap,
    leftTie,
    pure,
    replace,
    tie
} from '../lib/promise-monad';

function add(a: number, b: number, c: number, d: number): Promise<number> {
    return pure(a + b + c + d);
}

describe('lib/promise-monad', () => {
    describe('fmap', () => {
        it('should apply a function to a given functor', async () => {
            const ba1 = await fmap(add, Promise.resolve(1));
            expect(await ba1(1, 2, 3)).toBe(7);

            const ba2 = await fmap(ba1, Promise.resolve(2));
            expect(await ba2(4, 5)).toBe(12);

            const ba3 = await fmap(ba2, Promise.resolve(3));
            expect(await ba3(6)).toBe(12);

            const ba4 = await fmap(ba3, Promise.resolve(4));
            expect(ba4).toBe(10);
        });
    });
    describe('replace', () => {
        it('should return with correct value', () => {
            expect(replace(5, Promise.resolve(1))).toStrictEqual(
                Promise.resolve(5)
            );
            expect(replace(4, Promise.reject(1))).toStrictEqual(
                Promise.resolve(4)
            );
        });
    });
    describe('<*>/tie', () => {
        it('should sequence operations and combine their results', async () => {
            const ba1 = await tie(pure(add), Promise.resolve(1));
            expect(await ba1(1, 2, 3)).toBe(7);

            const ba2 = await tie(pure(ba1), Promise.resolve(2));
            expect(await ba2(4, 5)).toBe(12);

            const ba3 = await tie(pure(ba2), Promise.resolve(3));
            expect(await ba3(6)).toBe(12);

            const ba4 = await tie(pure(ba3), Promise.resolve(4));
            expect(ba4).toBe(10);
        });
    });
    describe('leftTie', () => {
        it('should sequence operations and combine their results', () => {
            expect(
                leftTie(Promise.resolve(5), Promise.resolve('a'))
            ).toStrictEqual(Promise.resolve(5));
        });
    });
    describe('>>=', () => {
        it('Sequentially compose two actions', async () => {
            const ba1 = comp(add, Promise.resolve(1));
            expect(await ba1(1, 2, 3)).toBe(7);

            const ba2 = comp(ba1, Promise.resolve(2));
            expect(await ba2(4, 5)).toBe(12);

            const ba3 = comp(ba2, Promise.resolve(3));
            expect(await ba3(6)).toBe(12);

            const ba4 = comp(ba3, Promise.resolve(4));
            expect(await ba4).toBe(10);
        });
    });
});
