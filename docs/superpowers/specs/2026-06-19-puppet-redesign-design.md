# 皮影戏工坊与演出一致性 · 双核玩法重设计

- **日期**：2026-06-19
- **状态**：设计已审定，待生成实现计划
- **范围**：工坊四道工序的玩法重做 + 工坊→排练→演出→回放的资产一致性
- **不影响**：导航结构、摄像头交互逻辑、剧本范围、账号体系

---

## 0. 问题诊断

### 0.1 现状两个核心问题

**问题 1：玩法薄。** 当前四道工序都是"清单完成"模式：

| 工序 | 当前交互 | 完成判定 |
|---|---|---|
| 制皮 | 点击 12 个红点 | `clicked.size === 12` |
| 雕刻 | 点击 6 个虚线区域 | `carved.size === 6` |
| 上色 | 涂完 5 个 region | `coloredRegions.size === 5` |
| 装关节 | 拖三条滑块然后点确认 | 点击"确认关节"按钮 |

没有失败、没有节奏、没有判断对错。"工艺知识"是装饰文字，不影响玩法。

**问题 2：三处皮影对不上。** 代码层面已定位根因：

- 角色选择页看到的影偶、工坊里"做"的影偶、演出/回放里看到的影偶，是 **三套独立 SVG**
- 工坊与演出之间唯一传递的状态是 `colors`（5 个 region 颜色） + `currentPose`（3 个角度）
- 玩家雕的纹饰、绷的钉、上色的具体笔触——演出时全部丢失
- 演出影偶其实跟玩家做没做过工坊几乎无关，这是用户最大的割裂感来源

### 0.2 设计目标（强约束）

1. **同一份皮影资产贯穿全流程**：角色选择页预览它、工坊里编辑它、演出页操纵它、回放页放它。三处皮影从此是同一个对象。
2. **双核玩法有真挑战**：雕刻 + 装关节两道工序有失败、有评级、有"再来一次"的钩子；制皮 + 上色保持轻氛围，不增门槛。
3. **10 分钟可完成 + 神品可刷**：一遍过的小白 ≤10 分钟，认真刷神品的玩家 20~30 分钟也愿意花；两条路径都不被堵。

### 0.3 非目标（防止 scope 蔓延）

- ❌ 不动 Home / RoleSelect 页面之外的导航结构
- ❌ 不重做演出阶段的摄像头交互逻辑（只让它用新资产渲染，不改交互）
- ❌ 不引入后端 / 多人 / 账号体系
- ❌ 不做新增角色，五个现有角色范围内
- ❌ 不做国际化、移动端手势优化、音效系统重写

---

## 1. 核心架构

### 1.1 资产模型 `PuppetAsset`

把当前散落在 `gameStore` 的 `colors / jointQuality / currentPose` 升级为一个完整对象，作为"我做的那具皮影"的唯一真实来源。

```ts
// src/types/puppet.ts (新建)
export type Grade = '下乘' | '中乘' | '上乘' | '神品';

export type CarveRegionId = 'face' | 'collar' | 'sash' | 'skirtL' | 'skirtR' | 'ornament';
export type ColorRegionId = 'head' | 'face' | 'robe' | 'sash' | 'prop';
export type JointId = 'head' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export interface PuppetAsset {
  roleId: RoleId;                      // 决定基础轮廓 SVG（悟空/唐僧/白骨精/八戒/沙僧）

  leather: {
    translucency: number;              // 0~1，制皮通透度，影响演出时透光感
  };

  carving: {
    regions: Record<CarveRegionId, {
      carved: boolean;                 // 是否雕过（没雕 → 演出时该处实心不透光）
      quality: number;                 // 0~1，该 region 的描线精度
    }>;
    overallQuality: number;            // 0~1，所有已雕 region 的加权平均
    grade: Grade;
  };

  coloring: Record<ColorRegionId, string>;   // hex 颜色

  joints: {
    pieces: Record<JointId, {
      offsetPx: number;                // 装配时铜钉偏移 0~5+px，决定演出卡顿
    }>;
    overallQuality: number;            // 0~1
    grade: Grade;
  };
}
```

**关键变化**：
- `gameStore.colors / jointQuality / currentPose` 全部并入 `PuppetAsset`
- `currentPose` 从"持久化资产"降级为演出/排练时的瞬时状态（每一帧的角度），不再存到 puppet 上（它属于"演"，不属于"做"）
- 新增"是否雕过"的 region 维度——做不全也有视觉惩罚，玩法更真

### 1.2 共享渲染器 `<ShadowPuppet />`

当前三套 SVG 合并为一个组件，用 `PuppetAsset + pose` 决定一切：

```tsx
// src/components/ShadowPuppet.tsx（新建，替代 PuppetFigure）
<ShadowPuppet
  asset={puppetAsset}
  pose={livePose}
  view="backstage"           // 'select' | 'backstage' | 'stage' | 'replay'
  showCarvingHints={false}   // 工坊雕刻时叠加虚线提示
/>
```

**五层渲染管线（自底向上）**：

1. **基础轮廓层** — 由 `roleId` 选基础 SVG（每角色一套独立轮廓：悟空金箍 / 唐僧袈裟 / 白骨精骷髅纹饰 / 八戒长嘴 / 沙僧月牙铲）。**解决"五个角色长一样"的割裂**。
2. **皮质层** — 由 `leather.translucency` 决定透光基色（0=暗哑，1=通透）
3. **镂空 / 刀痕层** — 由 `carving.regions` 决定：`carved=true` 的 region 显示镂空纹样，`quality` 越高纹样越清晰；`carved=false` 的 region 实心不透光（看得见的"没做完"）
4. **上色层** — 由 `coloring` 填充各 region
5. **关节 / 姿态层** — 由 `joints.pieces.offsetPx` 决定演出时的微抖与限位，由 `pose` 决定当前角度

每一层都是**纯函数式渲染**，只看 asset+pose，不存内部状态。

### 1.3 资产生命周期

```
RoleSelectPage:  selectRole() → initPuppet(roleId)（创建空 asset）
                 ↓
WorkshopPage:    四道工序逐步填充 leather / carving / coloring / joints
                 ↓
RehearsalPage:   只读 PuppetAsset，渲染同一具皮影，练习操控
                 ↓
StagePage:       只读 PuppetAsset，演出；关节 quality 影响动作平滑度
                 ↓
ReplayPage:      只读 PuppetAsset + 录制的 pose 帧
                 ↓
"再做一次" → resetPuppet()，回到 RoleSelectPage
```

**强制约束**：除 `RoleSelect` 和 `Workshop` 外，任何页面都不能写 `PuppetAsset`，只能读。这是"做的就是演的"在工程层的保证。

### 1.4 视觉一致性的"硬证据"

> 任何渲染 `<ShadowPuppet />` 的页面，都不允许在它周围再画一套 SVG 替代品。工坊里的"右侧预览"、角色选择页的"角色卡"、演出页的"主舞台"，都通过同一个组件、同一份 asset 渲染，只是 `view` prop 不同（决定光源、阴影、背景幕布）。

代码层面靠 **只 export `<ShadowPuppet />`，不 export 它内部的 SVG 部件** 来强制。

### 1.5 store 结构调整

```ts
// src/store/gameStore.ts（改）
interface GameState {
  puppet: PuppetAsset | null;
  currentPose: PuppetPoseData;          // 瞬时姿态，不持久化
  activePerformance?: PerformanceData;

  initPuppet: (roleId: RoleId) => void;
  updateLeather: (patch: Partial<PuppetAsset['leather']>) => void;
  updateCarving: (patch: Partial<PuppetAsset['carving']>) => void;
  updateColoring: (region: ColorRegionId, color: string) => void;
  updateJoints: (patch: Partial<PuppetAsset['joints']>) => void;
  setPose: (pose: PuppetPoseData) => void;
  resetPuppet: () => void;
}
```

`workshopSteps / completedSteps` 由 `puppet` 派生（完成 = 该字段被填到合法值），通过 selector `useWorkshopProgress()` 获取——避免双真相源。

---

## 2. 双核玩法

### 2.1 主难度核：雕刻 · 描线稳手流

**交互流程**：

1. 工坊雕刻步骤进入，工作台是一张米白皮料（`#F4E5C0`），上面有 6 条虚线轮廓（face / collar / sash / skirtL / skirtR / ornament），刚开始是暗淡的红色虚线。
2. 玩家按住鼠标 / 触屏，沿当前激活的虚线拖动，从起点拖到终点。
3. 拖动时：
   - 鼠标位置离虚线中心线越近 → 这一段刀痕越细越干净（深色 `#3a2412` 实线）
   - 偏离越远 → 毛刺越多（短随机抖动 + 浅色辅线）
   - 速度过快（>800 px/s）→ 抖刀痕；速度过慢（<60 px/s）→ 拖泥带水的粗痕
   - 中途松开 → 这一段未完成，可以从断点继续，但断点处会留一个接刀疤
4. 一条 region 的虚线全部走完 → 该 region `carved = true`，quality 由"偏差均值 + 速度方差 + 接刀次数"算出
5. 6 条 region 按推荐顺序激活（脸谱 → 衣领 → 腰带 → 裙 → 纹饰），允许跳过——跳过的 region 演出时实心不透光（看得见的代价）

**反馈线**：

- 实时：鼠标尖端跟一支细刻刀，刀尖落在虚线 ≤2 px 内时虚线高亮金色 → 给"对的"信号
- 节拍辅助（可关）：虚线上每隔一段距离有一个呼吸光点，提示推刀节奏（对应"推刀拉刀"工艺感）
- 段末：这条 region 完成时显示该段评级（下乘 / 中乘 / 上乘 / 神品），并按段累计到右侧"皮影预览"上（完成一条，预览影偶对应位置就出现镂空）

**喂回 asset**：

```ts
carving.regions[id] = { carved: true, quality: 0~1 }
carving.overallQuality = 加权平均（纹饰权重最高，腰带最低）
carving.grade = qualityToGrade(overallQuality)
```

**失败 / 重做**：

- 完成时 grade < 中乘 → 弹询问"再来一次?可以挽救你的影人。"——非强制
- 选择"再来" → 该 region 数据清空，虚线复位
- 选择"完成走人" → 保留当前数据，继续下一步

### 2.2 次难度核：装关节 · 对位拼装流

**交互流程**：

1. 工坊装关节步骤进入，工作台中央是已上色的影偶躯干（没有头、没有四肢）
2. 周围散布 4~5 个待装部件：头、左臂、右臂、左腿、右腿
3. 每个部件上有一个铜钉（发亮金色圆点），躯干上对应位置有一个穿孔（深色圆环）
4. 玩家拖动部件，把铜钉对准穿孔——但是：
   - 穿孔位置会轻微飘移（±3 px，模拟手抖，像现实中皮料柔软晃动）
   - 松手时铜钉离穿孔中心的距离就是 `offsetPx`（0=完美，5+=很差）
5. 五个关节装完 → 进入"试拉"环节：影偶被自动摆一个标准亮相 pose，玩家可以实时看到关节是否流畅——offsetPx 大的关节会抖一下 / 错位 1~2 px
6. 玩家可以选"重装"任意一个偏差大的关节（只重做那一个，不全清）

**反馈线**：

- 拖动时穿孔有磁吸提示（进入 8 px 内时穿孔变金）→ 给"快对上了"的信号，但不自动吸附（否则没挑战）
- 装上后铜钉收紧动画（0.3 s 弹性），offsetPx 越大收紧时晃动越久 → 体感"装歪了"
- 试拉时影偶按节奏举手、转头——offsetPx > 3 的关节肉眼可见地抖

**喂回 asset**：

```ts
joints.pieces[id] = { offsetPx: 0~5+ }
joints.overallQuality = 1 - clamp(avg(offsetPx) / 5, 0, 1)
joints.grade = qualityToGrade(overallQuality)
```

**失败 / 重做**：

- 单个关节 offsetPx > 4 → 在试拉环节标红，默认勾选"重装这一个"，玩家可取消
- 五个关节整体 grade < 中乘 → 询问"再装一次整套?"——非强制

### 2.3 评级 → 演出表现的映射

雕刻和关节的 grade 不是奖章，是真实参数。在演出 / 回放页：

| 维度 | 下乘 | 中乘 | 上乘 | 神品 |
|---|---|---|---|---|
| **镂空纹样清晰度**（由 carving） | 模糊，边缘毛糙 | 一般 | 清晰 | 极致清晰 + 细金边 |
| **未雕 region 的呈现** | 实心不透光，演出时该处是黑块 | 同左 | 同左 | 同左 |
| **关节动作幅度**（由 joints） | 上限 60% | 80% | 100% | 110%（略过头，有戏剧性） |
| **关节平滑度** | 抖动明显 | 偶尔抖 | 顺滑 | 顺滑 + 0.1 s 缓动 |
| **演出开场亮相** | 无 | 无 | 无 | **多 1 秒定格 + 金色光晕**（神品彩蛋） |

**一句话原则**：做得好，演出真的好看好控；做得糙，演出真的难看难控。用户能直接看见，不是数字面板。

### 2.4 氛围工序的处理

**制皮**：依然是 12 个绷钉点击。新增：点击节奏稳定（间隔 < 1.5 s）→ `leather.translucency` 接近 1；乱点 → 0.7。**没有失败**，最差也是 0.7。给"老老实实绷"一个微小奖励，但不卡人。

**上色**：依然 5 个 region 自由涂色。新增：鼓励但不强制使用"传统矿物色盘"内颜色；颜色直接进 asset，**没有评级**。

这两道工序不出现"再来一次"询问——它们是放松节拍，不是挑战。

### 2.5 难度曲线全貌

```
[制皮]   轻 · 节奏练习       30 秒    无失败，贡献通透度
   ↓
[雕刻]   重 · 主难度核       3~5 分   有评级，可重做（非强制）
   ↓
[上色]   轻 · 自由表达       1~2 分   无评级，纯创作
   ↓
[关节]   中 · 次难度核       2~3 分   有评级，可单独重装
   ↓
[排练]   操控练习            自由
   ↓
[演出]   兑现你的皮影        1~2 分
```

节奏：轻 → 重 → 轻 → 中 → 演出。两个核之间夹一个"上色"作为情绪缓冲，符合戏曲的张弛。

---

## 3. 页面级改动清单

改动幅度标记：🟢轻 / 🟡中 / 🔴重写

### 3.1 类型与状态层

- 🟢 **新建** `src/types/puppet.ts`：`PuppetAsset`、`Grade`、`CarveRegionId`、`ColorRegionId`、`JointId` 类型；`qualityToGrade()` 工具；`createEmptyPuppet(roleId)` 工厂
- 🟡 **改写** `src/store/gameStore.ts`：删除 `completedSteps / colors / jointQuality`（前两者改 puppet 派生 / 内嵌，最后一个并入 puppet），新增 puppet 字段及其 mutator；`persist` 只持久化 `puppet + activePerformance`；提供 `useWorkshopProgress()` selector
- 🟢 **重写** `src/data/validators.ts` 中的失效校验为基于 `PuppetAsset` 的判定（如有）

### 3.2 渲染层

- 🔴 **新建** `src/components/ShadowPuppet.tsx`：5 层渲染（基础轮廓 / 皮质 / 镂空·刀痕 / 上色 / 关节·姿态），内部子组件不 export
- 🔴 **新建** `src/components/puppet/silhouettes/`：五个角色专属基础轮廓 SVG（`WukongSilhouette / TangsengSilhouette / BaigujingSilhouette / BajieSilhouette / ShasengSilhouette`）
- 🔴 **删除** `src/components/PuppetFigure.tsx`
- 🟡 **改** `src/components/ProgressRail.tsx`：从读 `completedSteps` 改为读 `puppet`，多显示评级 chip
- 🟢 `ControlPad.tsx / GameShell.tsx / Empty.tsx`：不动

### 3.3 页面层

- 🟡 **`RoleSelectPage.tsx`**：选角时调用 `initPuppet(roleId)`；角色卡用 `<ShadowPuppet view="select" />` 渲染（空 asset 显示"未上色基础皮人"）
- 🔴 **`WorkshopPage.tsx`** 重写：抽出迷你游戏到 `src/pages/workshop/games/`（`LeatherGame / CarvingGame / ColoringGame / JointingGame`），主文件只剩布局 + 步骤路由 + 右侧 `<ShadowPuppet>` 预览，目标 < 200 行
  - `LeatherGame.tsx` 改：加节奏判定，输出 `translucency`
  - `CarvingGame.tsx` 全新交互：按住描线 / 偏差判定 / 段评级
  - `ColoringGame.tsx` 改：输出进 `puppet.coloring`
  - `JointingGame.tsx` 全新交互：对位拼装 / 试拉环节 / `offsetPx` 判定 / 单关节重装
- 🟡 **`RehearsalPage.tsx`**：换 `<ShadowPuppet view="backstage">`；演示 pose 按 `joints.overallQuality` 调整动作幅度；不改交互
- 🟡 **`StagePage.tsx`**：换渲染器；录制每帧 pose 时应用关节 `offsetPx` 微抖；神品评级触发开场多 1 秒定格 + 金色光晕
- 🟡 **`ReplayPage.tsx`**：换渲染器；回放时显示"你这具影人：雕刻 X · 关节 Y"
- 🟢 **`Home.tsx`**：若 hero 区有影偶预览，换 `<ShadowPuppet>`（空 asset），其余不动
- 🟢 **`SourcesPage.tsx`**：不动

### 3.4 数据层

- 🟢 **改** `src/data/gameData.ts`：`roles[]` 增加 `silhouetteKey`；`workshopSteps[]` 文案对齐新玩法
- 🟢 **新建** `src/data/grading.ts`：`qualityToGrade()` 阈值 — 0~0.4 下乘 / 0.4~0.65 中乘 / 0.65~0.85 上乘 / 0.85~1 神品；评级文案 / 颜色 / 反馈语映射

### 3.5 改动量汇总

| 类别 | 文件数 | 总量估算 |
|---|---|---|
| 🔴 重写或新建大件 | 8 个（ShadowPuppet + 5 silhouettes + Carving + Jointing 重写） | ~1500 行新增 / ~600 行删除 |
| 🟡 中等改动 | 6 个（gameStore / Workshop 主文件 / Rehearsal / Stage / Replay / ProgressRail） | ~400 行变更 |
| 🟢 轻改或不动 | 5 个 | ~50 行 |
| **合计** | **~19 个文件** | **~2500 行净变化** |

**实现期注意点**：
- 持久化迁移：旧 `localStorage` 里的 `colors / jointQuality` 需要一次性 migration 映射到新 `PuppetAsset`，或直接通过 `version` 升级清空（demo 阶段建议后者）
- ShadowPuppet 五层 SVG 性能：演出阶段每帧重算镂空纹样会卡，纹样不随 pose 变只随 asset 变 → 用 `useMemo` 缓存 SVG path

---

## 4. 实现顺序与里程碑

强制 5 个里程碑，**每个里程碑都能跑、能演**。任何阶段被中断都不至于交付半截品。

### 🏁 M1：地基 — 资产模型 + 共享渲染器最小可用版

**目标**：让"三处皮影对得上"在工程层立起来，玩法暂时不变。

- [ ] 新建 `src/types/puppet.ts`
- [ ] 改写 `gameStore.ts`（puppet 字段 + selector + migration）
- [ ] 新建 `ShadowPuppet.tsx`（先实现通用人形 silhouette，五层管线先跑通）
- [ ] RoleSelect / Workshop 右侧预览 / Rehearsal / Stage / Replay 全部换成 ShadowPuppet
- [ ] 删除 `PuppetFigure.tsx`

**验收**：全流程能跑通，看到的影偶是同一具——形象暂为通用人形，玩法仍是老的。**问题 2 根因解决**。

### 🏁 M2：五个角色轮廓 — 让"我选的"真的是"我做的"

- [ ] 新建 `src/components/puppet/silhouettes/` 五个 SVG 组件
- [ ] ShadowPuppet 的"基础轮廓层"按 `roleId` 选 silhouette
- [ ] RoleSelect 角色卡看到的就是该角色的真正轮廓预览

**验收**：选孙悟空和选白骨精，从角色页到演出页全程长得不一样。

### 🏁 M3：主难度核 — 雕刻描线玩法

- [ ] 新建 `CarvingGame.tsx`（按住描线 / 偏差判定 / 段评级）
- [ ] ShadowPuppet 的"镂空·刀痕层"接 `carving.regions`
- [ ] 工坊右侧预览实时显示已雕的 region（雕一个亮一个）
- [ ] 评级阈值 + "再来一次?"询问 UI

**验收**：雕刻有手感、有失败、有重做钩子；雕得越准演出越通透——可以肉眼对比上乘 vs 下乘的演出影偶差别。

### 🏁 M4：次难度核 — 关节对位玩法

- [ ] 新建 `JointingGame.tsx`（对位拖拽 / 飘移穿孔 / 试拉环节 / 单关节重装）
- [ ] ShadowPuppet 的"关节·姿态层"接 `joints.pieces.offsetPx`（演出时按 offsetPx 加微抖动）
- [ ] StagePage 录帧时把 offsetPx 抖动写入回放

**验收**：装得准演出动作幅度大且顺，装歪了演出真的会肉眼可见地抖。

### 🏁 M5：打磨与彩蛋 — 神品奖励 + 评级回响

- [ ] 制皮节奏判定喂 `leather.translucency`
- [ ] ColoringGame 输出进 `puppet.coloring`（M1 顺手就该做完，这里收尾确认）
- [ ] ReplayPage 显示"你这具影人：雕刻 X · 关节 Y"
- [ ] StagePage 神品开场多 1 秒定格 + 金色光晕
- [ ] migration 清掉旧 localStorage（version 升级方式）

**验收**：全流程仪式感闭环，神品玩家有专属彩蛋，小白玩家 10 分钟一遍过也舒服。

### 4.1 里程碑演示价值

| 里程碑 | 完成后能展示的 |
|---|---|
| M1 | 「三处皮影一致」的工程证据 |
| M2 | 「五个角色真有差异」的视觉证据 |
| M3 | 「雕刻是真游戏」的玩法证据（可现场刷神品） |
| M4 | 「做的就是演的」的兑现证据（歪关节真的演出歪动作） |
| M5 | 「仪式感 + 文化叙事」的整体闭环 |

任何一个里程碑卡住，前面的都已经能演。

---

## 5. 风险与备选

### 5.1 风险清单

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| 五个角色轮廓 SVG 工作量超预期（M2） | 高 | 中 | 降级：先做悟空 + 白骨精两个差异最大的，其他三个用通用人形过渡，演示主推这两个 |
| ShadowPuppet 演出时每帧重算太卡 | 中 | 高 | 镂空纹样只随 asset 变，用 `useMemo` 缓存 SVG path，pose 只改 transform |
| 雕刻"按住描线"在触屏上手感差 | 中 | 中 | M3 内置难度开关：简易模式偏差容忍从 ±2 px 放宽到 ±6 px |
| localStorage 旧数据 migration 失败 | 低 | 低 | demo 阶段 `version` 升级清空，不做向下兼容（README 注明） |
| 10 分钟时长被雕刻拖爆 | 中 | 高 | 中乘以上不弹询问；6 个 region 中默认只激活 4 个核心，纹饰 / 腰带可跳过 |
| TRAE 评委时间紧只看前 2 分钟 | 高 | 高 | 给 demo 模式：URL 加 `?demo=1` 跳过制皮 / 上色，直接进雕刻 |

### 5.2 最低可交付版本（备选退路）

如果在 M3 或 M4 卡住，最低可交付版本是：**M1 + M2 + 简化版 M3**（雕刻只做"沿虚线连点"，不做按住描线）。

这版本仍然解决了**问题 2（三处一致）** 和**问题 1 的一半（雕刻有评级）**，装关节保持现状。仍然是一个比当前版本完整得多的 demo，工作量约为完整版 50%。

---

## 6. 验收标准（端到端）

完整版 5 个里程碑全部完成时，必须能演示以下场景：

1. **一致性证据**：选悟空 → 工坊做半截 → 直接跳演出 → 演出影偶就是工坊里那半截（缺的 region 是黑块），不是别的影偶。
2. **角色差异证据**：选悟空和选白骨精，从首页到演出页**轮廓完全不同**，肉眼能区分。
3. **玩法兑现**：同一关卡演两次，故意"下乘版"和故意"神品版"的演出影偶**清晰度、动作幅度、平滑度肉眼可辨**。
4. **难度可控**：从角色选择到演出结束，新手一遍过 ≤10 分钟。
5. **彩蛋**：神品评级触发开场金色光晕 + 1 秒定格。

---

## 7. 后续工作（不在本 spec 范围）

- 多人 / 排行榜 / 账号
- 摄像头交互判定升级
- 新角色 / 新剧本
- 音效系统重写
- 国际化 / 英文版
- 移动端手势优化

每一项后续若做，开新 spec。
