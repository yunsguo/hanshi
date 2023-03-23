import { Either, Left, Right, partitionEithers } from '@hanshi/either';
import { Functional, proxied } from '@hanshi/prelude';

const failableize = <F extends Functional>(
    f: F
): ((...args: Parameters<F>) => Either<unknown, ReturnType<F>>) =>
    proxied((target: F, args: Parameters<F>) => {
        try {
            return Right.of(target(...args));
        } catch (e) {
            return Left.of(e);
        }
    }, f);

function rollette(n: number) {
    if (n % 6 === 2) throw new Error('dead');
    return 'ok';
}

const results = [...Array(12).keys()].map(failableize(rollette));

console.log('results', results);

const [errors, oks] = partitionEithers(results);

console.log('errors', errors);

console.log('oks', oks);
