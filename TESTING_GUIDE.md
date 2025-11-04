# 测试指南 - Maximum Update Depth 错误修复

## 快速验证

### 方法 1：本地运行（推荐）

1. **启动开发服务器**：
```bash
npm run dev
```

2. **打开浏览器**：
访问 `http://localhost:3000`

3. **测试步骤**：
   - ✅ 页面加载完成
   - ✅ 点击 "calculate time" 按钮
   - ✅ 页面应该正常响应，无错误
   - ✅ 配速输入框应该显示从距离和时间计算出的配速
   - ✅ 再点击 "calculate distance" 按钮
   - ✅ 页面应该正常响应，无错误
   - ✅ 距离输入框应该显示从时间和配速计算出的距离

### 方法 2：生产构建

1. **构建项目**：
```bash
npm run build
```

2. **启动生产服务器**：
```bash
npm start
```

3. **重复测试步骤 1 中的步骤 3**

## 应该看不到的错误信息

修复后，在浏览器控制台中不应该看到：

```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, 
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## 预期行为

### 初始状态（pace 模式）
- 距离：42.195 km（马拉松标准距离）
- 时间：3:30:00
- 配速：5'00" / km（自动计算）

### 切换到 "calculate time" 模式
1. 点击 "calculate time" 按钮
2. 配速输入框会显示基于距离和时间的计算结果
3. 距离和时间输入框启用
4. 配速输入框变成灰色（被禁用）

### 切换到 "calculate distance" 模式
1. 点击 "calculate distance" 按钮
2. 距离输入框会显示基于时间和配速的计算结果
3. 时间和配速输入框启用
4. 距离输入框变成灰色（被禁用）

### 回到 "calculate pace" 模式
1. 点击 "calculate pace" 按钮
2. 配速输入框会显示基于距离和时间的计算结果
3. 所有输入框恢复启用

## 浏览器控制台检查

1. 打开浏览器开发者工具（F12 或 Right-click → Inspect）
2. 切换到 "Console" 标签页
3. 进行上述测试步骤
4. 确认没有红色错误信息（除非有其他无关的错误）

## 相关代码

修复涉及文件：
- `components/Calculator.tsx`：主要计算器组件
- 关键改进：第二个 useEffect 的条件检查和 previousModeRef

## 技术细节

### 修复原理

原始代码中的问题：
```
useEffect 1（计算）← 依赖 [paceMinutes, paceSeconds, ...]
    ↓ 
  setResult
    ↓
useEffect 2（同步配速）← 依赖 [result.paceSecondsPerUnit, mode]
    ↓
  setPaceMinutes, setPaceSeconds
    ↓
  [paceMinutes, paceSeconds] 改变
    ↓
  回到 useEffect 1（无限循环！）
```

修复后的流程：
```
点击模式按钮改变 mode
    ↓
useEffect 1 计算新 result
    ↓
useEffect 2 检查：mode !== 'pace' && previousModeRef.current === 'pace'
    ↓
如果条件为真，更新配速输入框
否则，跳过 setState
    ↓
记录当前 mode 到 previousModeRef
    ↓
流程结束（无循环！）
```

## 已知限制

- 这个修复仅在模式切换时同步配速输入框
- 当用户在非 pace 模式下修改其他输入框时，配速会自动更新但不会反映到输入框
- 这是预期行为，因为在这些模式下输入框被禁用

## 如有问题

如果在测试时遇到其他问题，请：
1. 检查浏览器控制台错误信息
2. 清除浏览器缓存（Ctrl+Shift+Delete 或 Cmd+Shift+Delete）
3. 重新加载页面（Ctrl+R 或 Cmd+R）
4. 检查 `BUG_FIX.md` 了解更多技术细节
