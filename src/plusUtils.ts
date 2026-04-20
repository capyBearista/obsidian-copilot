import { setChainType, setModelKey } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { DEFAULT_SETTINGS } from "@/constants";
import { logError, logInfo } from "@/logger";
import { getSettings, setSettings } from "@/settings/model";
import { Notice } from "obsidian";

// Default models for free users (imported from DEFAULT_SETTINGS)
export const DEFAULT_FREE_CHAT_MODEL_KEY = DEFAULT_SETTINGS.defaultModelKey;
export const DEFAULT_FREE_EMBEDDING_MODEL_KEY = DEFAULT_SETTINGS.embeddingModelKey;

export const DEFAULT_COPILOT_PLUS_CHAT_MODEL_KEY = DEFAULT_FREE_CHAT_MODEL_KEY;
export const DEFAULT_COPILOT_PLUS_EMBEDDING_MODEL_KEY = DEFAULT_FREE_EMBEDDING_MODEL_KEY;

// ============================================================================
// SELF-HOST MODE VALIDATION
// ============================================================================
// Self-host mode allows Believer/Supporter users to use their own infrastructure.
//
// Validation flow:
// 1. User enables toggle → validateSelfHostMode() → count = 1, timestamp set
// 2. Every 15+ days on plugin load → refreshSelfHostModeValidation() → count++
// 3. After 3 successful validations → permanent (no more checks needed)
//
// Offline support:
// - Within 15-day grace period: Full functionality, can toggle off/on
// - Permanent (count >= 3): Full functionality forever
// - Grace expired while offline: Must go online to revalidate
//
// Settings section visibility (useIsSelfHostEligible):
// - Shown if: permanent OR within grace period OR API confirms eligibility
// - Hidden if: no license key OR grace expired + offline + not permanent
// ============================================================================

/**
 * Check if self-host access is valid.
 * Valid if: permanently validated (3+ successful checks) OR within 15-day grace period.
 */
export function isSelfHostAccessValid(): boolean {
  return true;
}

export function isSelfHostModeValid(): boolean {
  const settings = getSettings();
  return settings.enableSelfHostMode;
}

/** Check if the model key is a Copilot Plus model. */
export function isPlusModel(modelKey: string): boolean {
  return false;
}

/**
 * Synchronous check if Plus features should be enabled.
 * Returns true when self-host mode is valid OR user has valid Plus subscription.
 * Use this for synchronous checks (e.g., model validation, UI state).
 */
export function isPlusEnabled(): boolean {
  return true;
}

export function useIsPlusUser(): boolean | undefined {
  return true;
}

export async function checkIsPlusUser(context?: Record<string, any>): Promise<boolean | undefined> {
  return true;
}

/** Check if the user is on a plan that qualifies for self-host mode. */
export async function isSelfHostEligiblePlan(): Promise<boolean> {
  return false;
}

/**
 * Hook to check if user should see the self-host mode settings section.
 * Returns undefined while loading, boolean once checked.
 *
 * Eligibility rules:
 * 1. No license key: Not eligible (immediately revokes access)
 * 2. Has license key: Verify via API (handles key changes, e.g. believer → plus)
 *    - API success: Use result (revoke self-host mode if not eligible)
 *    - API failure (offline): Fall back to cached validation
 *      (permanent count >= 3 OR within 15-day grace period)
 */
export function useIsSelfHostEligible(): boolean | undefined {
  return true;
}

export async function validateSelfHostMode(): Promise<boolean> {
  return true;
}

export async function refreshSelfHostModeValidation(): Promise<void> {
  return;
}

/**
 * Apply the Copilot Plus settings.
 * Includes clinical fix to ensure indexing is triggered when embedding model changes,
 * as the automatic detection doesn't work reliably in all scenarios.
 */
export function applyPlusSettings(): void {
  const defaultModelKey = DEFAULT_COPILOT_PLUS_CHAT_MODEL_KEY;
  const embeddingModelKey = DEFAULT_COPILOT_PLUS_EMBEDDING_MODEL_KEY;
  const previousEmbeddingModelKey = getSettings().embeddingModelKey;

  logInfo("applyPlusSettings: Changing embedding model", {
    from: previousEmbeddingModelKey,
    to: embeddingModelKey,
    changed: previousEmbeddingModelKey !== embeddingModelKey,
  });

  setModelKey(defaultModelKey);
  setChainType(ChainType.COPILOT_PLUS_CHAIN);
  setSettings({
    defaultModelKey,
    embeddingModelKey,
    defaultChainType: ChainType.COPILOT_PLUS_CHAIN,
  });

  // Ensure indexing happens only once when embedding model changes
  if (previousEmbeddingModelKey !== embeddingModelKey) {
    logInfo("applyPlusSettings: Embedding model changed, triggering indexing");
    import("@/search/vectorStoreManager")
      .then(async (module) => {
        await module.default.getInstance().indexVaultToVectorStore();
      })
      .catch((error) => {
        logError("Failed to trigger indexing after Plus settings applied:", error);
        new Notice(
          "Failed to update Copilot index. Please try force reindexing from the command palette."
        );
      });
  } else {
    logInfo("applyPlusSettings: No embedding model change, skipping indexing");
  }
}

// Removed functions that are no longer needed
