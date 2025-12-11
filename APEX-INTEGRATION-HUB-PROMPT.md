# 🔗 APEX Integration Hub Architecture
## Execution Prompt v1.0 | December 10, 2025

---

## 🎯 MISSION

Design and implement **OMNiLiNK** — a centralized integration control pane for the APEX APP Ecosystem that enables seamless, modular connectivity between all APEX applications with enterprise-grade reliability.

---

## 📋 REQUIREMENTS MATRIX

### Core Deliverables
| Requirement | Target | Validation |
|-------------|--------|------------|
| Central Hub | Single control pane for all app integrations | Dashboard accessible, all apps visible |
| Modular SDK | Drop-in integration module for each app | `@apex/omnilink-sdk` installable in <5 min |
| Zero-Config | Apps connect without manual configuration | Auto-discovery on first boot |
| Idempotent Ops | Repeated calls produce identical results | Test: 100 identical requests = same state |
| Scalability | Handle 10K+ concurrent connections | Load test passes at 150% capacity |
| Latency | Integration calls <100ms p95 | APM confirms target met |

### Quality Attributes (Non-Negotiable)
- **Reliability**: 99.9% uptime SLA
- **Durability**: Zero data loss on integration events
- **Resilience**: Circuit breakers + exponential backoff
- **Security**: OAuth2 + API key rotation + rate limiting
- **Observability**: Distributed tracing across all integrations

---

## 🏗️ ARCHITECTURE SPECIFICATION

### Pattern: Hub-and-Spoke with Event-Driven Core

```
┌─────────────────────────────────────────────────────────────┐
│                    APEX CONTROL PANE                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OMNiLiNK Integration Hub               │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │   │
│  │  │ API       │ │ Event     │ │ Registry &        │ │   │
│  │  │ Gateway   │ │ Bus       │ │ Discovery         │ │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────────┬─────────┘ │   │
│  │        │             │                 │           │   │
│  │  ┌─────┴─────────────┴─────────────────┴─────┐     │   │
│  │  │         Message Router & Transformer       │     │   │
│  │  └─────────────────────┬─────────────────────┘     │   │
│  └────────────────────────┼─────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │TradeLine│        │JubeeLove│        │ Future  │
   │  24/7   │        │   AI    │        │  Apps   │
   │ ┌─────┐ │        │ ┌─────┐ │        │ ┌─────┐ │
   │ │ SDK │ │        │ │ SDK │ │        │ │ SDK │ │
   │ └─────┘ │        │ └─────┘ │        │ └─────┘ │
   └─────────┘        └─────────┘        └─────────┘
```

### Component Breakdown

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **API Gateway** | Rate limiting, auth, routing | Kong / AWS API Gateway |
| **Event Bus** | Async messaging, pub/sub | Redis Streams / AWS EventBridge |
| **Service Registry** | App discovery, health checks | Consul / AWS Cloud Map |
| **Message Router** | Protocol translation, transformation | Custom middleware |
| **SDK Module** | App-side integration client | TypeScript package |

---

## 🔧 EXECUTION PROTOCOL

### Phase 1: ANALYZE (Week 1)
```yaml
Tasks:
  - [ ] Audit existing APEX apps for integration touchpoints
  - [ ] Map current data flows between apps
  - [ ] Identify shared entities (users, orgs, subscriptions)
  - [ ] Document API contracts for each app
  - [ ] Define canonical data model (JSON Schema)

Outputs:
  - Integration touchpoint map
  - Canonical data model v1
  - API contract inventory
```

### Phase 2: DESIGN (Week 2)
```yaml
Tasks:
  - [ ] Design hub API schema (OpenAPI 3.1)
  - [ ] Define event taxonomy (CloudEvents spec)
  - [ ] Architect SDK interface
  - [ ] Plan authentication flow
  - [ ] Design circuit breaker patterns

Outputs:
  - OpenAPI spec for hub
  - Event catalog
  - SDK TypeScript interfaces
  - Auth sequence diagrams
```

### Phase 3: BUILD (Weeks 3-5)
```yaml
Tasks:
  - [ ] Scaffold hub service (Node.js/TypeScript)
  - [ ] Implement API Gateway layer
  - [ ] Build event bus infrastructure
  - [ ] Create SDK package (@apex/omnilink-sdk)
  - [ ] Integrate first app (TradeLine 24/7)

Outputs:
  - Running hub instance
  - Published SDK package
  - First app integrated
```

### Phase 4: VALIDATE (Week 6)
```yaml
Tasks:
  - [ ] Load testing (k6 or Artillery)
  - [ ] Chaos engineering (failure injection)
  - [ ] Security audit (OWASP scan)
  - [ ] Integration tests (Playwright)
  - [ ] Documentation review

Outputs:
  - Test reports (all green)
  - Security clearance
  - Production-ready release
```

---

## 🛡️ GUARDRAILS & SAFEGUARDS

### Regression Prevention
```typescript
// Every PR must include:
interface PRChecklist {
  unitTests: boolean;        // >80% coverage on new code
  integrationTests: boolean; // E2E for affected flows
  backwardCompat: boolean;   // No breaking changes without version bump
  rollbackPlan: boolean;     // Documented rollback procedure
}
```

### Overload Protection
```yaml
Circuit Breaker Config:
  failure_threshold: 5        # Failures before opening
  success_threshold: 3        # Successes before closing
  timeout: 30s                # Time in open state

Rate Limiting:
  default: 100 req/min/client
  burst: 150 req/min/client
  premium: 500 req/min/client

Backpressure:
  queue_depth: 1000
  action_on_full: reject_oldest
```

### Idempotency Contract
```typescript
// All SDK operations must be idempotent
interface IdempotentOperation<T> {
  idempotencyKey: string;     // Client-provided UUID
  execute(): Promise<T>;       // Operation logic
  verify(): Promise<boolean>;  // State verification
}

// Hub stores operation results for 24h
// Duplicate keys return cached result
```

---

## ✅ QUALITY GATES (10/10 Required)

| # | Gate | Criteria | Pass |
|---|------|----------|------|
| 1 | **Types** | Zero `any` in TypeScript, strict mode | ☐ |
| 2 | **Coverage** | >80% unit test coverage | ☐ |
| 3 | **Integration** | All E2E tests pass | ☐ |
| 4 | **Performance** | API <100ms p95, <500ms p99 | ☐ |
| 5 | **Security** | OWASP scan clean, no critical CVEs | ☐ |
| 6 | **Load** | Handles 150% expected traffic | ☐ |
| 7 | **Resilience** | Survives dependency failure | ☐ |
| 8 | **Idempotency** | Duplicate ops produce same result | ☐ |
| 9 | **Documentation** | OpenAPI + SDK docs complete | ☐ |
| 10 | **Rollback** | Can revert in <5 minutes | ☐ |

---

## 📦 SDK SPECIFICATION

### Installation
```bash
npm install @apex/omnilink-sdk
# or
yarn add @apex/omnilink-sdk
```

### Basic Usage
```typescript
import { OmniLink } from '@apex/omnilink-sdk';

// Auto-discovers hub from environment or config
const omni = await OmniLink.connect({
  appId: 'tradeline-247',
  apiKey: process.env.OMNILINK_API_KEY,
});

// Subscribe to events from other apps
omni.on('jubeelove:user.created', async (event) => {
  await syncUser(event.payload);
});

// Emit events to the ecosystem
await omni.emit('tradeline:call.completed', {
  callId: '123',
  duration: 180,
  outcome: 'converted',
});

// Call another app's API (routed through hub)
const response = await omni.call('jubeelove', 'GET', '/api/users/123');
```

### SDK Features
- **Auto-retry** with exponential backoff
- **Circuit breaker** per destination app
- **Request deduplication** via idempotency keys
- **Automatic serialization** (JSON + Protocol Buffers)
- **Health checks** and connection pooling
- **Type-safe events** via generated types

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests
```typescript
describe('OmniLink SDK', () => {
  it('connects to hub with valid credentials', async () => {});
  it('rejects invalid API keys', async () => {});
  it('retries failed requests 3 times', async () => {});
  it('opens circuit after 5 failures', async () => {});
  it('deduplicates requests with same idempotency key', async () => {});
});
```

### Integration Tests (Playwright)
```typescript
// tests/e2e/omnilink-integration.spec.ts
test('cross-app event propagation', async ({ page }) => {
  // Trigger event in TradeLine
  await page.goto('/calls/new');
  await page.click('[data-testid="complete-call"]');
  
  // Verify event received in JubeeLove (via hub)
  // Poll JubeeLove API or check webhook logs
  await expect(eventReceivedInJubeeLove()).resolves.toBe(true);
});
```

### Load Tests (k6)
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post('https://hub.apexbiz.io/v1/events', {
    type: 'test.event',
    data: { timestamp: Date.now() },
  });
  check(res, { 'status is 202': (r) => r.status === 202 });
  sleep(0.1);
}
```

---

## 📊 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Integration Time | <1 day per app | Time from SDK install to first event |
| Event Latency | <50ms median | Hub → destination app delivery |
| Availability | 99.9% | Monthly uptime percentage |
| Error Rate | <0.1% | Failed integrations / total |
| Developer NPS | >70 | Survey of integration developers |

---

## 🚀 DEPLOYMENT STRATEGY

### Infrastructure
```hcl
# Terraform pseudo-config
module "omnilink_hub" {
  source = "./modules/omnilink"
  
  environment    = "production"
  instance_type  = "t3.large"
  min_instances  = 3
  max_instances  = 10
  
  redis_cluster  = true
  postgres_ha    = true
  
  monitoring     = "datadog"
  alerting       = "pagerduty"
}
```

### Rollout Plan
1. **Canary** (5% traffic) → Monitor for 24h
2. **Staged** (25% → 50% → 100%) → 48h per stage
3. **Rollback trigger**: Error rate >1% OR latency p99 >1s

---

## 📚 REFERENCE COMMANDS

```bash
# Development
npm run dev                    # Start hub locally
npm run test                   # Run all tests
npm run test:coverage          # Coverage report
npm run lint                   # ESLint + Prettier

# Quality Gates
npm run quality:check          # All gates in sequence
npm run security:scan          # Dependency audit
npm run perf:profile           # Performance benchmark

# Deployment
npm run build                  # Production build
npm run deploy:canary          # Deploy to 5%
npm run deploy:rollback        # Emergency rollback
```

---

## 🎛️ EXECUTION FLAGS

```yaml
# Toggle these based on context
verbosity: high          # low | medium | high
risk_tolerance: low      # conservative approach
test_coverage: strict    # >80% enforced
documentation: complete  # OpenAPI + README + Examples
monitoring: production   # Full observability stack
```

---

**Prompt Author**: APEX Business Systems  
**Version**: 1.0  
**Last Updated**: December 10, 2025 MST  
**Execution Target**: Claude Code / Cursor AI / Copilot Workspace
