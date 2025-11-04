# Maximum Update Depth 错误修复报告

## 问题描述

在加载页面后，第一次点击 "calculate time" 或 "calculate distance" 按钮会出现以下错误：

```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, 
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## 根本原因

这个错误由 `Calculator.tsx` 中的两个相互依赖的 `useEffect` 钩子引起：

### 原始代码的问题流程：

1. **第一个 useEffect（计算逻辑）**：
   - 依赖：`[mode, distance, hours, minutes, seconds, paceMinutes, paceSeconds]`
   - 当 `mode` 改变时，根据新的计算模式计算 `result`
   - 调用 `setResult(newResult)`

2. **第二个 useEffect（配速同步）**：
   - 依赖：`[result.paceSecondsPerUnit, mode]`
   - 当 `result.paceSecondsPerUnit` 改变时，更新配速输入框
   - 调用 `setPaceMinutes` 和 `setPaceSeconds`

3. **无限循环**：
   - setState 调用 → 触发重新渲染
   - 重新渲染 → paceMinutes 和 paceSeconds 改变
   - paceMinutes/paceSeconds 改变 → 第一个 useEffect 依赖变化
   - 第一个 useEffect 重新计算 → result 改变
   - result 改变 → 第二个 useEffect 触发
   - 回到第 3 步（无限循环）

## 解决方案

修改第二个 useEffect，使用 `previousModeRef` 来追踪之前的模式：

```typescript
const previousModeRef = useRef<CalculationMode>('pace');

// 当模式改变时，同步配速输入框（仅在切换到 time 或 distance 模式时）
useEffect(() => {
  // 仅在模式从 pace 切换到其他模式时，才更新配速输入框
  if (mode !== 'pace' && previousModeRef.current === 'pace') {
    const paceTime = secondsToTime(result.paceSecondsPerUnit);
    setPaceMinutes(paceTime.minutes.toString());
    setPaceSeconds(paceTime.seconds.toString());
  }
  previousModeRef.current = mode;
}, [mode, result.paceSecondsPerUnit]);
```

### 关键改进：

1. **条件检查**：`previousModeRef.current === 'pace'`
   - 只有在从 'pace' 模式切换到其他模式时，才执行 setState
   - 这样即使 `result.paceSecondsPerUnit` 改变，也只有在第一次模式转换时才会更新配速输入框

2. **引入 previousModeRef**：
   - 用于记忆之前的模式
   - 避免在每次 `result.paceSecondsPerUnit` 改变时都调用 setState

3. **依赖数组更新**：
   - 从 `[mode]` 改为 `[mode, result.paceSecondsPerUnit]`
   - 这样能够满足 ESLint 的依赖检查，同时通过条件逻辑避免无限循环

## 修改前后对比

### 修改前：
```typescript
// 第二个 useEffect
useEffect(() => {
  if (mode !== 'pace') {
    const paceTime = secondsToTime(result.paceSecondsPerUnit);
    setPaceMinutes(paceTime.minutes.toString());
    setPaceSeconds(paceTime.seconds.toString());
  }
}, [result.paceSecondsPerUnit, mode]);  // ❌ result.paceSecondsPerUnit 变化时每次都会执行
```

### 修改后：
```typescript
// 第二个 useEffect
useEffect(() => {
  // ✅ 只在从 'pace' 切换到其他模式时执行
  if (mode !== 'pace' && previousModeRef.current === 'pace') {
    const paceTime = secondsToTime(result.paceSecondsPerUnit);
    setPaceMinutes(paceTime.minutes.toString());
    setPaceSeconds(paceTime.seconds.toString());
  }
  previousModeRef.current = mode;
}, [mode, result.paceSecondsPerUnit]);
```

## 测试结果

- ✅ 构建成功（Compiled successfully）
- ✅ 无 ESLint 错误
- ✅ 点击 "calculate time" 或 "calculate distance" 不再出现 Maximum update depth 错误

## 总结

通过使用 ref 来追踪之前的状态，并添加条件检查，我们成功地阻止了无限更新循环，同时保持了必要的功能：当用户切换计算模式时，配速输入框会自动同步显示计算结果。
