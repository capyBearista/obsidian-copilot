import { SettingItem } from "@/components/ui/setting-item";
import { updateSetting, useSettingsValue } from "@/settings/model";
import React from "react";
import { ToolSettingsSection } from "./ToolSettingsSection";

export const CopilotPlusSettings: React.FC = () => {
  const settings = useSettingsValue();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <section className="tw-flex tw-flex-col tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-pt-4 tw-text-xl tw-font-semibold">Autonomous Agent</div>

          <SettingItem
            type="switch"
            title="Enable Autonomous Agent"
            description="Enable autonomous agent mode in Plus chat. The AI will reason step-by-step and decide which tools to use automatically, improving response quality for complex queries."
            checked={settings.enableAutonomousAgent}
            onCheckedChange={(checked) => {
              updateSetting("enableAutonomousAgent", checked);
            }}
          />

          {settings.enableAutonomousAgent && (
            <>
              <ToolSettingsSection />
            </>
          )}

          <div className="tw-pt-4 tw-text-xl tw-font-semibold">Document Processor</div>

          <SettingItem
            type="text"
            title="Store converted markdown at"
            description="When PDFs and other documents are processed, the converted markdown is saved to this folder. Leave empty to skip saving."
            value={settings.convertedDocOutputFolder}
            onChange={(value) => {
              updateSetting("convertedDocOutputFolder", value);
            }}
            placeholder="e.g. copilot/converteddocs"
          />

          <div className="tw-pt-4 tw-text-xl tw-font-semibold">Memory (experimental)</div>

          <div className="tw-rounded-md tw-border tw-p-4 tw-text-sm">
            <strong>Temporarily Disabled:</strong> The long-term memory system and local history
            context are temporarily disabled in this free fork until a non-paywalled implementation
            is finalized.
          </div>
        </div>
      </section>
    </div>
  );
};
