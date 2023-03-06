import { defineDefaultedLiftAN, defineDefaultedv$, id } from '@hanshi/prelude';
import {
    warp,
    fmap,
    leftTie,
    pure,
    v$,
    rightTie,
    tie,
    liftAN
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
    describe('v$', () => {
        it('should return with correct value', () => {
            const v$2 = defineDefaultedv$(fmap);
            expect(v$(5, Promise.resolve(1))).toStrictEqual(v$2(5, pure(1)));

            expect(v$(4, Promise.reject(1)).catch(id)).toStrictEqual(
                v$(4, Promise.reject(1)).catch(id)
            );
        });
    });
    describe('<*>', () => {
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
    describe('liftAN', () => {
        it('should sequence operations and combine their results', async () => {
            const liftAN2 = defineDefaultedLiftAN(pure, tie);
            const args = [1, 2, 3, 4].map(pure) as [
                Promise<number>,
                Promise<number>,
                Promise<number>,
                Promise<number>
            ];
            expect(liftAN(add)(...args)).toStrictEqual(liftAN2(add)(...args));
        });
    });

    describe('leftTie', () => {
        it('should sequence operations and combine their results', () => {
            expect(
                leftTie(Promise.resolve(5), Promise.resolve('a'))
            ).toStrictEqual(Promise.resolve(5));
        });
    });
    describe('rightTie', () => {
        it('should sequence operations and combine their results', () => {
            expect(
                rightTie(Promise.resolve(5), Promise.resolve('a'))
            ).toStrictEqual(Promise.resolve('a'));
        });
    });
    describe('>>=', () => {
        it('Sequentially wrap two actions', async () => {
            expect(
                await warp(
                    Promise.resolve([1, 1, 2, 3] as [
                        number,
                        number,
                        number,
                        number
                    ]),
                    add
                )
            ).toBe(7);
        });
    });
});
