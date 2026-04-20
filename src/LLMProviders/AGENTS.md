# LLM Providers & Adapters

**Technology**: LangChain, Custom Providers
**Entry Point**: `LLMProviderManager.ts`
**Parent Context**: Extends [../../AGENTS.md](../../AGENTS.md)

## Architecture

### Provider Pattern
- All providers must implement the `LLMProvider` interface.
- Adapters in `chainRunner/utils/modelAdapter.ts` handle model-specific prompt formatting.

### Adding a Provider
1. Create a new provider file in `src/LLMProviders/`.
2. Implement the streaming logic.
3. Register the provider in `LLMProviderManager`.
4. Update settings UI in `src/components/Settings/` to support the new provider.

## Rules
- ❌ **MUST NOT** hardcode API endpoints. Use settings/configuration.
- ✅ **DO**: Use `langchain` integrations where possible for stability.
- ✅ **DO**: Handle rate limiting (429) and timeout errors gracefully.

## Testing
- **MUST** mock network calls in tests.
- **MUST** test both streaming and non-streaming modes if applicable.
