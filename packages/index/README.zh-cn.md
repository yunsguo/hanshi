# 寒食

`寒食`(hanshi)是一个函数式工具库，旨在以*最小样板代码*、*模版合规性*以及*原生 `TypeScript`/`JavaScript` 支持*为设计理念。
对于那些不太关心这些方面的人来说，`寒食`提供了对一些原生类型如 `Array` 和 `Promise` 的简洁`单子`操作（就是传说中的*函数式黑魔法*），以及各种方便的实用方法。

_阅读其他语言版本: [English](README.md), [简体中文](README.zh-cn.md)_

## 使用

```typescript
import {
    warp as warpPromise,
    fmap as fmapPromise,
    lift as liftPromise
} from '@hanshi/promise-typeclass';

// import { PromiseTypeclass as pt } from 'hanshi'; // 也可以作为一个命名空间导入并以 pt.warp 指代

// const { warp: warpPromise, fmap: fmapPromise, lift: liftPromise } = pt; // 也可以解构并重命名

const waitedValue = <T>(v: T, t: number): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(v), t));

const terminalWithPromise = (a: number): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(a + 5), 500));

const waited1sNumber10 = warpPromise(waitedValue(5, 500), terminalWithPromise); // 对于返回 Promise 的任何函数，warp ( haskell 中的`>>=`操作符)可以将 Promise 值当作一个普通的(等待后的)值来`部分应用`，并**正常返回原值**。

function display<T>(n: T) {
    console.log('value', n);
}

fmapPromise(display, waited1sNumber10); // 对于任何函数(返回 Promise 或返回一般值)，fmap 可以将 Promise 当成普通（等待后的）参数`部分应用`到给定函数上，但**返回值也会变为Promise**。

// 函数 display 没有返回值，因此从技术上讲这个调用现在返回的是Promise<void>。

// fmap 会保留 Promise 的副作用。比如说，这个 display 调用将在调度器中等待1秒。

const terminalWithPromise2 = (a: number, b: string): Promise<number> =>
    new Promise((resolve) => setTimeout(() => resolve(b.length + a), 2000));

const waited4sNumber20 = warpPromise(
    waitedValue(10, 1000),
    warpPromise(waitedValue('abcdefghji', 1000), terminalWithPromise2)
); // 由于 monad 具有结合性，warp 操作会以与`部份应用`相反的顺序传参和调用。

fmapPromise(display, waited4sNumber20); // 这个 display 调用将在调度器中等待4秒，因为所有副作用都保留了。

const noneTerminal = (name: string, value: object): string =>
    name + JSON.stringify(value);

const liftedNoneTerminal = liftPromise(noneTerminal); // 给定一个函数，Lift 会返回一个所有参数和返回值都是 Promise 的版本。

fmapPromise(
    display,
    liftedNoneTerminal(
        waitedValue('waited name', 1500),
        waitedValue({ sample: 1 }, 1500)
    )
); // 这个 display 调用将在调度器中等待3秒，因为所有副作用都保留了。
```
