import { decay, dmap } from '../lib';

class NewType<T> {
    [decay]: T;
    constructor(a: T) {
        this[decay] = a;
    }
}

describe('lib/decayable', () => {
    const inc = (n: { b: number }) => n.b + 1;
    describe('dmap', () => {
        const n = new NewType({ b: 5 });
        it('should return the mapped value', () => {
            expect(dmap(inc, n)).toBe(6);
        });
        it('should rethrow with proper message when applicable', () => {
            expect(() => dmap(inc, null)).toThrow();
            expect(() => dmap(inc, undefined)).toThrow();
            expect(() => dmap(inc, {})).toThrow();
            expect(() => dmap(inc, [1, 2, 3])).toThrow();
            expect(() => dmap(inc, Promise.resolve('ok'))).toThrow();
        });
        const t = (b: number) => {
            throw b;
        };
        it('should rethrow the original when not applicable', () => {
            expect(() => dmap(t, 4)).toThrow();
        });
    });
});
