import { _, curry } from '@hanshi/prelude';

const add = (a: number, b: number) => a + b;

const add2With = _(add, 2);

console.log(add(2, 3) === add2With(3));

const linear = (a: number, b: number, x: number) => a * x + b;

const curriedLinear = curry(linear);

const [a, b, c] = [...Array(3).keys()].map(() => Math.random());

console.log(linear(a, b, c) === curriedLinear(a)(b)(c));
