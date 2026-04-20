# Search, Indexing & Vector Stores

**Technology**: Orama, MiniSearch, LangChain Embeddings
**Parent Context**: Extends [../../AGENTS.md](../../AGENTS.md)

## Architecture

### Hybrid Search
- **Lexical Search**: Handled by `MiniSearch` or `FullTextEngine`.
- **Semantic Search**: Handled by `Orama` and LangChain embedding providers.
- **Deduplication**: `mergeResults.ts` ensures unique hits across engines.

### Indexing Lifecycle
- Managed by `IndexManager.ts`.
- **MUST** support incremental updates (only index changed files).
- **MUST** handle vault-wide re-indexing safely (background task).

## Rules
- ✅ **DO**: Redact PII or sensitive content if logging search results.
- ✅ **DO**: Use `ChunkedStorage` for large files to avoid memory exhaustion.
- ❌ **NEVER** block the main thread with indexing; use `requestIdleCallback` or async chunks.

## Search Navigation
```bash
# Find embedding providers
rg -n "class .*Embeddings" src/search

# Find query expansion logic
rg -n "QueryExpander" src/search/v3
```
