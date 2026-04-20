# Core Architecture - Message & Business Logic

**Technology**: TypeScript
**Key Files**: `ChatManager.ts`, `MessageRepository.ts`, `ContextManager.ts`
**Parent Context**: Extends [../../AGENTS.md](../../AGENTS.md)

## Patterns & Rules

### Clean Architecture
- ✅ **DO**: Use `MessageRepository` as the single source of truth for messages.
- ✅ **DO**: Orchestrate complex logic in `ChatManager`.
- ✅ **DO**: Delegate UI notifications to `ChatUIState`.
- ❌ **DON'T**: Implement business logic directly in React components.

### Message Storage
- `displayText` is for UI (what the user sees).
- `processedText` is for LLM (includes XML context tags).
- **MUST** reprocess context via `ContextManager` when a message is edited.

### Project Isolation
- Each project has its own `MessageRepository` instance.
- Always use `getCurrentMessageRepo()` in `ChatManager` to ensure project-bound operations.

## Testing Guidelines
- Use Jest for unit tests.
- Mock Obsidian API when necessary.
- **MUST** verify that message edits correctly update the chain memory.
- Example: See `MessageLifecycle.test.ts` for end-to-end logic flow tests.
