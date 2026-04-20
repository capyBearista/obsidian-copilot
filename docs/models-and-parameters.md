# Models and Parameters

This guide explains how to manage chat models, embedding models, and the parameters that control how the AI behaves.

---

## Chat Models

### Built-In Models

Copilot comes with a set of built-in models across many providers. Some are always included ("core" models); others can be enabled or disabled.

| Model | Provider | Capabilities |
|---|---|---|

| openai/text-embedding-3-small | OpenRouter |
| text-embedding-3-small | OpenAI |
| text-embedding-3-large | OpenAI |
| embed-multilingual-light-v3.0 | Cohere |
| text-embedding-004 | Google |
| gemini-embedding-001 | Google |
| Qwen3-Embedding-0.6B | SiliconFlow |

### Selecting an Embedding Model

Go to **Settings → Copilot → QA** → **Embedding Model**.

If you change embedding models, you must rebuild the vault index because the old vectors are incompatible with the new model. Copilot will prompt you to confirm before rebuilding.

### What Embeddings Affect

- **Vault QA mode** — Uses embeddings to find relevant notes by meaning
- **Semantic Search** — The "Enable Semantic Search" toggle in QA settings
- **Relevant Notes** — Shows semantically similar notes in the sidebar

---

## Model Parameters

These settings control how the AI responds. Global defaults live in Settings → Copilot → Model. You can override them per-session using the gear icon in the chat panel.

### Temperature

Controls how random or creative the responses are.

- **Range**: 0.0–1.0
- **Default**: 0.1
- **Low (0.0–0.2)**: Precise, factual, deterministic
- **Medium (0.4–0.6)**: Balanced
- **High (0.8–1.0)**: Creative, varied, less predictable

### Max Tokens

Maximum number of tokens in the AI's response. A **token** is roughly ¾ of a word (so 1,000 tokens ≈ 750 words).

- **Default**: 6,000
- Higher values allow longer responses but cost more

### Conversation Turns in Context

How many past conversation turns to include in each request. More turns = more context but larger requests.

- **Default**: 15 turns
- Reduce this if you hit context limits or want to lower costs

### Auto-Compact Threshold

When the conversation reaches this many tokens, older messages are automatically summarized.

- **Default**: 128,000 tokens
- **Range**: 64,000–1,000,000 tokens
- See [Chat Interface](chat-interface.md#auto-compact) for details

### Reasoning Effort

For reasoning-capable models (like deepseek-reasoner, claude-opus-4-6), controls how much internal reasoning the model does before responding.

- **Options**: minimal, low, medium, high, xhigh
- **Default**: low
- Higher effort = better results on complex tasks, slower responses

### Verbosity

For models that support it, controls response length and detail.

- **Options**: low, medium, high
- **Default**: medium

### Top P

An alternative to temperature for controlling randomness. Leave at default unless you have a specific reason to change it.

### Frequency Penalty

Reduces the likelihood of the model repeating itself.

---

## Default Model Selection

Your **default model** is the one Copilot uses when you open a new chat. Set it in:
**Settings → Copilot → Basic → Default Chat Model**

The default is **OpenRouter Gemini 2.5 Flash** (requires OpenRouter API key).

---

## Related

- [LLM Providers](llm-providers.md) — Set up API keys for your provider
- [Vault Search and Indexing](vault-search-and-indexing.md) — How embedding models are used
