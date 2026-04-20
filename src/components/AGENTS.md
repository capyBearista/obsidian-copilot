# UI Components & Styling

**Technology**: React, Radix UI, Tailwind CSS
**Parent Context**: Extends [../../AGENTS.md](../../AGENTS.md)

## Standards

### React Components
- ✅ **DO**: Functional components with hooks.
- ✅ **DO**: Use Radix UI primitives for accessible components (Modals, Selects, etc.).
- ✅ **DO**: Use `lucide-react` for icons.
- ✅ **DO**: Extract reusable logic into custom hooks.
- ❌ **DON'T**: Use class components.
- ❌ **DON'T**: Use inline `style` props; use Tailwind classes.

### Styling (Tailwind)
- ✅ **DO**: Use design tokens from `tailwind.config.js`.
- ✅ **DO**: Use `clsx` and `tailwind-merge` for conditional classes.
- ❌ **NEVER** edit `styles.css` directly.
- ❌ **NEVER** hardcode hex colors; use Tailwind utility classes.

### State Integration
- Components should subscribe to `ChatUIState` via `useChatManager` hook.
- Prefer `jotai` for atomic UI settings.

## Quick Find
```bash
# Find Radix UI usage
rg -n "@radix-ui" src/components

# Find Tailwind custom class usage
rg -n "className=" src/components
```
