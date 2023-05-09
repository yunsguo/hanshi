# `@hanshi/array-typeclass`

```typescript
import * as AT from '@hanshi/array-typeclass';
import { _ } from '@hanshi/prelude';

const add = (n: number) => n + 1;

console.log('fmap add [1,2,3,4,5] = ', AT.fmap(add, [1, 2, 3, 4, 5]));

const linear = (a: number, x: number, b: number) => a * x + b;

console.log(
    'linear <$> [-1, 0, 1, 2] <*> [-2, -1, 0, 1, 2, 3] <*> [-1, 0, 1] = ',
    AT.tie(
        AT.tie(AT.fmap(linear, [-1, 0, 1, 2]), [-2, -1, 0, 1, 2, 3]),
        [-1, 0, 1]
    )
);

const liftedLinear = AT.lift(linear);

console.log(
    'liftedLinear [-1, 0, 1, 2] [-2, -1, 0, 1, 2, 3] [-1, 0, 1] = ',
    liftedLinear([-1, 0, 1, 2], [-2, -1, 0, 1, 2, 3], [-1, 0, 1])
);

const limitedLinear = (a: number, b: number) =>
    AT.tie(AT.fmap(_(linear, a), [-2, -1, 0, 1, 2, 3, 4, 5]), AT.pure(b));

for (const i of [-1, 0, 1])
    for (const j of [-2, 0, 3])
        console.log(`limitedLinear(${i}, ${j})`, limitedLinear(i, j));

console.log(
    'limitedLinear =<< [-1,0,1] <<= [-2, 0 ,3 ] = ',
    AT.warp([-2, 3], AT.warp([-1, 1], limitedLinear))
);

console.log(
    'limitedLinear =<< [-1,0,1] <<= [-2, 0 ,3 ] = ',
    AT.warp([-1, 1], limitedLinear)(5)
);
```
