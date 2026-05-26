## 🧠 Research Positioning

**Research Problem:**
Programmatic advertising systems (ADX/SSP/DSP) make thousands of filtering and bidding decisions per second, but these decisions are nearly invisible to operators. When win rates drop or revenue anomalies appear, diagnosing the cause requires manually correlating logs across multiple system layers — a process that is slow, expertise-dependent, and rarely leaves a traceable decision record.

**Research Question:**
How can an AI diagnostic agent surface the reasoning behind automated system decisions in real time, enabling operators to trace, explain, and act on decision failures without deep engineering expertise?

**Overarching research thread:**
> AI-assisted decision traceability — here applied to automated system workflows: the same "evidence → decision → inspectable trace" principle from [UserResearchAgent-CF](https://github.com/MyraWang0406/UserResearchAgent-CF), applied to programmatic ad exchange decisions rather than organizational requirements

**Relation to other prototypes:**
- Shares the "no diagnosis without traceable evidence chain" principle with [UserResearchAgent-CF](https://github.com/MyraWang0406/UserResearchAgent-CF)
- The whitebox log format is a domain-specific instantiation of "evidence-backed decision trace"

**Informal evaluation:**
Sprint 1–3 implemented and tested with simulated traffic. AI diagnostic agent tested against four anomaly patterns (low win rate, size mismatch, floor price filtering, blocklist filtering).

**Limitations:**
- Simulated traffic only; not validated against real ADX production data
- Anomaly thresholds (e.g., win rate < 10%) are heuristic, not learned from data
- LLM diagnostic suggestions not formally evaluated for accuracy or operator utility
- No user study with actual ad operations professionals

---

# 白盒化广告交易模拟工厂

Mintegral 风格的白盒化广告交易系统，包含后端模拟引擎和前端可视化看板。

## 核心设计思路

传统 ADX 系统是黑盒的——你知道结果，但不知道为什么。这个项目的核心是**白盒化**：每一个决策点（过滤、出价、竞胜）都注入详细的追踪日志，让 AI 诊断 Agent 和操作人员都能看到完整的决策链路。

```
SSP 流量 → ADX 过滤 → DSP 出价 → 竞价结果
              ↓
         whitebox.log（每个决策点完整记录）
              ↓
         AI 诊断 Agent（异常检测 + LLM 建议）
              ↓
         可视化看板（损耗漏斗 + 决策链路追踪）
```

## 项目结构

```
.
├── schemas.py          # 数据协议定义
├── engine.py           # 核心交易引擎 (SSP/ADX/DSP)
├── main.py             # 后端模拟运行入口
├── whitebox.log        # 白盒日志文件
└── app/                # Next.js 前端应用
    ├── api/logs/        # API Route 读取日志
    ├── components/      # React 组件
    └── page.tsx         # 主页面
```

## 功能特性

### 后端 (Sprint 1) — 交易引擎
- SSP 流量发起模拟
- ADX 过滤逻辑（底价、黑名单、尺寸匹配）
- DSP 出价策略（CTR 基础出价公式）
- 白盒日志注入（每个决策点详细记录）

### 前端 (Sprint 2) — 可视化看板
- 实时交易流（最新交易简报）
- 损耗漏斗图（Request → Valid → Bid → Win）
- 白盒排查区（点击失败请求查看完整决策链路）
- 自然语言翻译 reason_code
- 深色主题 UI（Datadog/Grafana 风格）

### AI 诊断 Agent (Sprint 3) — 自动异常检测
- 定期分析 whitebox.log 日志
- 异常检测规则：
  - 中标率 < 10% → 竞争激烈分析
  - 尺寸不匹配 > 30% → 素材问题警告
  - 底价过滤 > 50% → 底价设置过高警告
  - 黑名单过滤 > 20% → 黑名单过滤提示
- LLM 集成（支持 GPT-4o；无 API Key 时使用规则模拟）
- AI 专家建议卡片（问题总结、操作建议、优先级）

## 快速开始

```bash
# 生成白盒日志
python main.py

# 安装前端依赖并启动
npm install
npm run dev
```

访问 http://localhost:3000 查看可视化看板。

## 技术栈

**后端:** Python 3.8+ · 标准库（dataclasses, json, datetime）  
**前端:** Next.js 14 · React 18 · TypeScript · Tailwind CSS

## Research Fit

`human-AI collaboration` · `decision traceability` · `AI-assisted diagnosis` · `organizational workflows` · `explainable AI`











# 白盒化广告交易模拟工厂

Mintegral 风格的白盒化广告交易系统，包含后端模拟引擎和前端可视化看板。

## 项目结构

```
.
├── schemas.py          # 数据协议定义
├── engine.py           # 核心交易引擎 (SSP/ADX/DSP)
├── main.py             # 后端模拟运行入口
├── whitebox.log        # 白盒日志文件
├── app/                # Next.js 前端应用
│   ├── api/logs/       # API Route 读取日志
│   ├── components/     # React 组件
│   └── page.tsx        # 主页面
└── package.json        # 前端依赖
```

## 快速开始

### 1. 运行后端模拟

```bash
# 生成白盒日志
python main.py
```

这将生成 `whitebox.log` 文件，包含所有决策点的详细追踪信息。

### 2. 启动前端看板

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看可视化看板。

## 功能特性

### 后端 (Sprint 1)
- ✅ SSP 流量发起模拟
- ✅ ADX 过滤逻辑（底价、黑名单、尺寸匹配）
- ✅ DSP 出价策略（CTR 基础出价公式）
- ✅ 白盒日志注入（每个决策点详细记录）
- ✅ 可扩展的面向对象设计

### 前端 (Sprint 2)
- ✅ 实时交易流（侧边栏显示最新交易简报）
- ✅ 损耗漏斗图（Request -> Valid -> Bid -> Win）
- ✅ 白盒排查区（点击失败请求查看详细决策链路）
- ✅ 自然语言翻译 reason_code
- ✅ 深色主题 UI（类似 Datadog/Grafana）
- ✅ 响应式设计

### AI 诊断 Agent (Sprint 3)
- ✅ 定期分析 whitebox.log 日志
- ✅ 异常检测：
  - 中标率 < 10% → "竞争激烈"分析
  - 尺寸不匹配占比 > 30% → "素材问题"警告
  - 底价过滤占比 > 50% → "底价设置过高"警告
  - 黑名单过滤占比 > 20% → "黑名单过滤较多"提示
- ✅ LLM 集成（支持 GPT-4o，无 API Key 时使用智能模拟）
- ✅ AI 专家建议卡片（显示问题总结、操作建议、优先级）

## 技术栈

### 后端
- Python 3.8+
- 标准库（dataclasses, json, datetime）

### 前端
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React（图标）

## API 接口

### GET /api/logs

读取 `whitebox.log` 的最后 100 行。

**响应:**
```json
{
  "logs": [...],
  "total": 100,
  "timestamp": "2026-01-15T10:14:45.000Z"
}
```

### GET /api/diagnose

执行 AI 诊断分析，返回异常检测结果和智能建议。

**响应:**
```json
{
  "status": "success",
  "timestamp": "2026-01-15T10:24:42.981670",
  "statistics": {
    "win_rate": 60.0,
    "win_stats": {...},
    "reject_analysis": {...}
  },
  "anomalies": [...],
  "ai_suggestions": {
    "summary": "...",
    "suggestions": ["建议：..."],
    "priority": "中"
  },
  "total_logs_analyzed": 44
}
```

## AI 诊断 Agent 配置

### 使用 OpenAI API（可选）

如果要使用真实的 GPT-4o API，设置环境变量：

```bash
export OPENAI_API_KEY="your-api-key-here"
```

或者在 `.env.local` 文件中设置：

```
OPENAI_API_KEY=your-api-key-here
```

**注意**：如果不设置 API Key，系统会使用智能模拟响应，基于检测到的异常类型生成合理的建议。

### 测试 Agent

```bash
python test_agent.py
```

## 开发说明

### 添加新的过滤规则

继承 `FilterRule` 基类：

```python
class CustomFilter(FilterRule):
    def apply(self, request_id: str, ad_request: Dict) -> Tuple[bool, str, Dict]:
        # 实现过滤逻辑
        pass
```

### 添加新的出价策略

继承 `BiddingStrategy` 基类：

```python
class CustomBiddingStrategy(BiddingStrategy):
    def calculate_bid(self, request_id: str, ad_request: Dict) -> Tuple[float, Dict, str]:
        # 实现出价逻辑
        pass
```

### 添加新的异常检测规则

在 `agent.py` 的 `detect_anomalies` 方法中添加：

```python
def detect_anomalies(self, logs: List[WhiteboxTrace]) -> List[Dict]:
    anomalies = []
    # ... 现有检测逻辑 ...
    
    # 添加新规则
    if your_condition:
        anomalies.append({
            'type': 'YOUR_ANOMALY_TYPE',
            'severity': 'high',
            'title': '问题标题',
            'description': '问题描述',
            'details': {...},
            'suggestion': '建议措施'
        })
    
    return anomalies
```

## 许可证

MIT

