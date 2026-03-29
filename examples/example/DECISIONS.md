# Architecture Decisions

## ADR-001: File-based storage over database
**Status:** Accepted
**Context:** For a demo/hackathon project, a database adds setup complexity without proportional value.
**Decision:** Use a JSON file (`data/todos.json`) for persistence.
**Consequence:** Not suitable for concurrent writes at scale, but fine for demonstration.

## ADR-002: Express over alternatives
**Status:** Accepted
**Context:** Express is the most widely understood Node.js web framework.
**Decision:** Use Express with minimal middleware.
**Consequence:** Simple, well-documented, easy for agents to work with.
