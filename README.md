# ADX-Mirix: White-Box Ad Exchange Simulator for Traceable Decision Diagnosis

ADX-Mirix is a white-box ad exchange simulator for studying traceable decision diagnosis in automated advertising workflows.

The research focus is not the advertising interface itself. The focus is how operators can inspect filtering, bidding, win/loss, and diagnostic decisions in a complex automated system.

## Project Information

| Item | Description |
|---|---|
| Status | Research prototype |
| Repository | https://github.com/MyraWang0406/ADX-Mirix-1.15-cursor |
| Live Demo | https://adx.mirix.myrawzm0406.online/ |
| Research Area | Human-AI Collaboration, Decision Traceability, AI-Assisted Diagnosis, Operational Workflows |
| Main Methods | White-box logging, simulated ADX workflow, anomaly detection, LLM-assisted diagnosis |
| Intended Use | Research demonstration, not production deployment |

## Research Positioning

Programmatic advertising systems such as ADX, SSP, and DSP pipelines make many filtering and bidding decisions. Operators often see the final metrics, but they do not easily see why requests were filtered, why bids failed, or why win rates changed.

When win rates drop or revenue anomalies appear, diagnosis usually requires manually correlating logs across multiple system layers. This process is slow, expertise-dependent, and rarely produces a reusable decision trace.

This prototype explores how AI-assisted diagnosis can make automated system decisions more inspectable.

## Research Question

How can an AI diagnostic agent surface the reasoning behind automated system decisions in real time, enabling operators to trace, explain, and act on decision failures without deep engineering expertise?

## Core Design Idea

Traditional ADX workflows are often black-box from the operator’s perspective.

This prototype makes the workflow white-box:

```text
SSP traffic
→ ADX filtering
→ DSP bidding
→ auction result
→ whitebox.log
→ AI diagnostic agent
→ visual diagnosis dashboard
```

Every decision point is logged. The AI diagnostic agent and the operator can inspect the same evidence chain.

## System Overview

The system simulates an advertising exchange workflow with three major parts:

1. Backend transaction simulation
2. White-box decision logging
3. Frontend diagnosis dashboard

The AI diagnostic agent reads `whitebox.log`, detects anomaly patterns, and generates operator-facing suggestions.

## Core Features

### Backend: Transaction Engine

- SSP traffic request simulation
- ADX filtering logic
- floor price filtering
- blocklist filtering
- size matching
- DSP bidding strategy
- CTR-based bid calculation
- win/loss simulation
- white-box logging at each decision point

### Frontend: Diagnosis Dashboard

- real-time transaction stream
- request-to-win loss funnel
- failed request inspection
- decision-chain view
- natural-language translation of reason codes
- operator-facing diagnostic summary

### AI Diagnostic Agent

- periodic analysis of `whitebox.log`
- anomaly pattern detection
- win-rate diagnosis
- size mismatch warning
- floor price filtering warning
- blocklist filtering warning
- LLM-assisted suggestions
- rule-based fallback when no API key is configured

## Example Anomaly Patterns

| Pattern | Signal | Possible Diagnosis |
|---|---|---|
| Low win rate | Win rate below threshold | Competition pressure or weak bid strategy |
| Size mismatch | High share of rejected requests | Creative inventory mismatch |
| Floor price filtering | Many requests filtered by floor price | Floor price may be too high |
| Blocklist filtering | High share of blocklist rejection | Targeting or policy constraints may be too strict |

## Research Contribution

This prototype applies the same evidence-to-decision-trace principle from requirements and user research workflows to automated advertising systems.

The contribution is not a production ADX engine. The research value is the traceable diagnosis workflow:

```text
system event
→ decision rule
→ logged reason
→ anomaly pattern
→ AI explanation
→ operator action
```

This makes invisible filtering and bidding decisions inspectable.

## Relation to Other Prototypes

This project is part of my broader research portfolio on traceable AI-assisted decision-making.

- `UserResearchAgent-CF` applies evidence citation and memory recall to requirements decisions.
- `ADX-Mirix` applies evidence-backed decision traces to automated advertising workflows.
- `PSM-DID-uplift` focuses on causal reasoning for traffic attribution and operational analytics.
- `Auto-sentiment-copilot-V1` applies evidence traceability to crowd feedback and requirement-signal extraction.

The shared design principle is:

> no diagnosis without traceable evidence.

## Repository Structure

```text
ADX-Mirix-1.15-cursor/
├── schemas.py           # Data schema definitions
├── engine.py            # Core transaction engine
├── main.py              # Backend simulation entry
├── whitebox.log         # White-box decision log
├── agent.py             # AI diagnostic agent
├── test_agent.py        # Agent test script
├── app/                 # Next.js frontend app
│   ├── api/logs/        # API route for reading logs
│   ├── api/diagnose/    # API route for diagnosis
│   ├── components/      # React components
│   └── page.tsx         # Main dashboard page
└── package.json         # Frontend dependencies
```

## Quick Start

Generate white-box logs:

```bash
python main.py
```

Install frontend dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## AI Diagnostic Agent Configuration

The system can run with either LLM-assisted diagnosis or rule-based fallback.

To use OpenAI API:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or create `.env.local`:

```text
OPENAI_API_KEY=your-api-key-here
```

If no API key is configured, the system uses rule-based simulated responses based on detected anomaly types.

Test the agent:

```bash
python test_agent.py
```

## API Endpoints

### `GET /api/logs`

Reads recent entries from `whitebox.log`.

Example response:

```json
{
  "logs": [],
  "total": 100,
  "timestamp": "2026-01-15T10:14:45.000Z"
}
```

### `GET /api/diagnose`

Runs AI-assisted diagnosis over recent logs.

Example response:

```json
{
  "status": "success",
  "statistics": {
    "win_rate": 60.0,
    "win_stats": {},
    "reject_analysis": {}
  },
  "anomalies": [],
  "ai_suggestions": {
    "summary": "...",
    "suggestions": ["..."],
    "priority": "medium"
  }
}
```

## Extending the Simulator

### Add a new filtering rule

```python
class CustomFilter(FilterRule):
    def apply(self, request_id: str, ad_request: dict):
        # implement filtering logic
        pass
```

### Add a new bidding strategy

```python
class CustomBiddingStrategy(BiddingStrategy):
    def calculate_bid(self, request_id: str, ad_request: dict):
        # implement bidding logic
        pass
```

### Add a new anomaly detection rule

Add a new rule in the diagnostic agent’s anomaly detection logic.

```python
def detect_anomalies(self, logs):
    anomalies = []
    # add custom anomaly detection logic here
    return anomalies
```

## Informal Evaluation

The prototype has been tested with simulated traffic across several anomaly patterns:

- low win rate
- size mismatch
- floor price filtering
- blocklist filtering

The diagnostic agent was tested against these simulated patterns, but no formal user study has been conducted.

## Current Limitations

- Simulated traffic only; not validated against real ADX production data.
- Anomaly thresholds are heuristic and not learned from historical data.
- LLM diagnostic suggestions have not been formally evaluated for accuracy or operator utility.
- No user study with actual ad operations professionals has been conducted.
- The simulator simplifies real ADX / SSP / DSP market complexity.

## Research Fit

`human-AI collaboration` · `decision traceability` · `AI-assisted diagnosis` · `organizational workflows` · `explainable AI` · `advertising systems`

## Status and Scope

This repository is a research prototype. It is intended to demonstrate how white-box logs and AI-assisted diagnosis can make automated system decisions inspectable.

It is not a production advertising exchange system.

## License

This repository is for research and portfolio demonstration purposes.
