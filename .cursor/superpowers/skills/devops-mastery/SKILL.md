---
name: devops-mastery
description: Elite software engineering toolkit for building production-grade applications. Use when developing, debugging, optimizing, or deploying code—especially for API development, database design, performance tuning, security hardening, CI/CD pipelines, and architectural decisions. Triggers on requests for code review, testing strategies, deployment automation, security audits, performance optimization, or technical architecture guidance.
---

# DevOps Mastery

Production-grade software engineering protocols for building scalable, secure, high-performance applications.

## Core Workflow

**ANALYZE → DIAGNOSE → OPTIMIZE → VALIDATE**

Every technical task follows this sequence:

1. **Analyze** (30%): Read code, map dependencies, identify patterns, assess constraints
2. **Diagnose** (20%): Trace execution, reproduce issues, profile metrics, find root cause
3. **Optimize** (30%): Design solutions, evaluate trade-offs, implement with best practices
4. **Validate** (20%): Write tests, verify edge cases, run quality checks, document

## Execution Protocols

### Protocol A: Bug Fixes
```
1. REPRODUCE → Write failing test
2. ISOLATE → Find minimal code path
3. FIX → Apply minimal change
4. VERIFY → Ensure tests pass
5. DOCUMENT → Explain WHY (not just what)
```

### Protocol B: New Features
```
1. DESIGN → Define types/interfaces FIRST
2. TEST → Write comprehensive tests
3. IMPLEMENT → Build incrementally
4. INTEGRATE → Ensure compatibility
5. OPTIMIZE → Refactor for quality
```

### Protocol C: Refactoring
```
1. BASELINE → Run ALL tests
2. EXTRACT → Identify refactor target
3. TRANSFORM → Small, safe steps
4. VALIDATE → Re-run tests after EACH change
5. POLISH → Improve naming, docs, types
```

### Protocol D: Performance
```
1. MEASURE → Profile with real data
2. HYPOTHESIS → Form theories
3. EXPERIMENT → Try optimizations
4. BENCHMARK → Measure improvement (2x+ target)
5. MONITOR → Check for regressions
```

## Technical Standards

### Code Quality
- **TypeScript**: Zero `any`, strict mode enabled
- **Testing**: >80% coverage for business logic
- **Performance**: Lighthouse >90 for web apps
- **Security**: Zero critical CVEs, OWASP Top 10 compliance
- **Architecture**: SOLID principles, design patterns

### Security Checklist
- Authentication: OAuth2/JWT with MFA
- Authorization: RBAC with least privilege
- Encryption: TLS 1.3, AES-256 at rest
- Input Validation: Sanitize ALL user inputs
- Secrets: Never commit, use environment variables
- Dependencies: Regular security audits

### Performance Targets
- API Response: <100ms (p50), <500ms (p99)
- Database Queries: <50ms, proper indexing
- Bundle Size: <250KB initial, code-split routes
- Caching: Redis for hot data, CDN for static assets

## Quality Gates

Before ANY code ships:
- ✅ All tests pass (unit + integration)
- ✅ TypeScript compiles with zero errors
- ✅ Linting passes with zero warnings
- ✅ Security scan shows no critical issues
- ✅ Performance benchmarks meet targets

## Architecture Patterns

### API Design
- RESTful endpoints with semantic versioning
- Rate limiting and request throttling
- Comprehensive error handling with proper status codes
- API documentation (OpenAPI/Swagger)
- Request/response validation schemas

### Database Design
- Normalized schema (3NF minimum)
- Strategic indexes on foreign keys and query fields
- Connection pooling and query optimization
- Migration strategy with rollback capability
- Backup and disaster recovery plan

### Deployment Strategy
- Docker multi-stage builds for minimal images
- Kubernetes for orchestration and autoscaling
- Blue-green deployments for zero downtime
- Infrastructure as Code (Terraform preferred)
- Monitoring with Prometheus/Grafana

## Debugging Strategy

1. **Reproduce**: Create minimal failing test case
2. **Isolate**: Remove unrelated variables
3. **Hypothesize**: Form theory about root cause
4. **Validate**: Test hypothesis with evidence
5. **Fix**: Apply minimal necessary change
6. **Verify**: Confirm fix + no regressions

## References

For detailed guidance on specific topics:
- API patterns: `references/api-patterns.md`
- Security standards: `references/security.md`
- Performance optimization: `references/performance.md`
- Testing strategies: `references/testing.md`

## Scripts

Quality automation tools:
- `scripts/quality-check.sh`: Run all quality gates
- `scripts/security-scan.sh`: Dependency vulnerability scan
- `scripts/performance-profile.sh`: Benchmark key operations
