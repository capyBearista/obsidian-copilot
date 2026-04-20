# Agent Tools & Integration

**Technology**: TypeScript
**Parent Context**: Extends [../../AGENTS.md](../../AGENTS.md)

## Design Patterns

### Tool Implementation
- Each tool should be an independent class or function.
- **MUST** define clear input/output schemas using Zod or equivalent.
- **MUST** include descriptive descriptions for the LLM to understand *when* to use the tool.

### Categories
- **Vault Tools**: `ReadNoteTool`, `SearchVaultTool`.
- **Utility Tools**: `TimeTools`, `MathTools`.
- **Composer Tools**: Tools that modify active editor content.

## Rules
- ✅ **DO**: Validate all LLM-provided arguments before execution.
- ✅ **DO**: Use `toolResultUtils.ts` for consistent result formatting.
- ❌ **NEVER** perform destructive file operations without a `replaceGuard` or similar safety check.

## Example
See `ReadNoteTool.test.ts` for how to test tool execution and validation.
