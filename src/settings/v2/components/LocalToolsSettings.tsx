import { SettingItem } from "@/components/ui/setting-item";
import { updateSetting, useSettingsValue } from "@/settings/model";
import React from "react";
import { ExternalLink } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";

export const LocalToolsSettings: React.FC = () => {
  const settings = useSettingsValue();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <section className="tw-flex tw-flex-col tw-gap-4">
        {/* Web Search Section */}
        <div className="tw-pt-4 tw-text-xl tw-font-semibold">Web Search (BYOK)</div>
        <div className="tw-mb-2 tw-text-sm tw-text-muted">
          Configure a Bring-Your-Own-Key provider to restore the Agent&apos;s ability to search the
          web.
        </div>

        <SettingItem
          type="select"
          title="Web Search Provider"
          description="Choose which service to use for web search."
          value={settings.localSearchProvider}
          onChange={(value) =>
            updateSetting(
              "localSearchProvider",
              value as "searxng" | "tavily" | "brave" | "exa" | "google"
            )
          }
          options={[
            { label: "SearxNG (Self-hosted/Free)", value: "searxng" },
            { label: "Tavily API", value: "tavily" },
            { label: "Brave Search API", value: "brave" },
            { label: "Exa API", value: "exa" },
            { label: "Google Custom Search", value: "google" },
          ]}
        />

        {settings.localSearchProvider === "searxng" && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-text-sm tw-font-medium">SearxNG Instance URL</div>
            <div className="tw-mb-1 tw-text-sm tw-text-muted">
              URL of your SearxNG instance (e.g., http://localhost:8080 or
              https://search.example.com). Make sure JSON output is enabled on the instance.
            </div>
            <Input
              value={settings.searxngUrl}
              onChange={(e) => updateSetting("searxngUrl", e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
        )}

        {settings.localSearchProvider === "tavily" && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-text-sm tw-font-medium">Tavily API Key</div>
            <div className="tw-mb-1 tw-text-sm tw-text-muted">
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noreferrer"
                className="tw-flex tw-items-center tw-gap-1 tw-text-accent"
              >
                Get API Key <ExternalLink className="tw-size-3" />
              </a>
            </div>
            <PasswordInput
              value={settings.tavilyApiKey}
              onChange={(value) => updateSetting("tavilyApiKey", value)}
              placeholder="tvly-..."
            />
          </div>
        )}

        {settings.localSearchProvider === "brave" && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-text-sm tw-font-medium">Brave Search API Key</div>
            <div className="tw-mb-1 tw-text-sm tw-text-muted">
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noreferrer"
                className="tw-flex tw-items-center tw-gap-1 tw-text-accent"
              >
                Get API Key <ExternalLink className="tw-size-3" />
              </a>
            </div>
            <PasswordInput
              value={settings.braveApiKey}
              onChange={(value) => updateSetting("braveApiKey", value)}
              placeholder="BSA..."
            />
          </div>
        )}

        {settings.localSearchProvider === "exa" && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-text-sm tw-font-medium">Exa API Key</div>
            <div className="tw-mb-1 tw-text-sm tw-text-muted">
              <a
                href="https://exa.ai/"
                target="_blank"
                rel="noreferrer"
                className="tw-flex tw-items-center tw-gap-1 tw-text-accent"
              >
                Get API Key <ExternalLink className="tw-size-3" />
              </a>
            </div>
            <PasswordInput
              value={settings.exaApiKey}
              onChange={(value) => updateSetting("exaApiKey", value)}
              placeholder="exa-..."
            />
          </div>
        )}

        {settings.localSearchProvider === "google" && (
          <>
            <div className="tw-flex tw-flex-col tw-gap-2">
              <div className="tw-text-sm tw-font-medium">Google Search API Key</div>
              <div className="tw-mb-1 tw-text-sm tw-text-muted">
                <a
                  href="https://developers.google.com/custom-search/v1/overview"
                  target="_blank"
                  rel="noreferrer"
                  className="tw-flex tw-items-center tw-gap-1 tw-text-accent"
                >
                  Get API Key <ExternalLink className="tw-size-3" />
                </a>
              </div>
              <PasswordInput
                value={settings.googleSearchApiKey}
                onChange={(value) => updateSetting("googleSearchApiKey", value)}
                placeholder="AIzaSy..."
              />
            </div>
            <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-2">
              <div className="tw-text-sm tw-font-medium">Google Search Engine ID (CX)</div>
              <Input
                value={settings.googleSearchEngineId}
                onChange={(e) => updateSetting("googleSearchEngineId", e.target.value)}
                placeholder="0123456789abcde..."
              />
            </div>
          </>
        )}

        {/* YouTube Section */}
        <div className="tw-pt-8 tw-text-xl tw-font-semibold">YouTube Extraction (yt-dlp)</div>
        <div className="tw-mb-2 tw-text-sm tw-text-muted">
          Requires{" "}
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noreferrer"
            className="tw-text-accent"
          >
            yt-dlp
          </a>{" "}
          to be installed locally to fetch video transcripts.
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-text-sm tw-font-medium">yt-dlp Executable Path</div>
          <div className="tw-mb-1 tw-text-sm tw-text-muted">
            Leave empty to use the system PATH (requires yt-dlp to be globally accessible).
          </div>
          <Input
            value={settings.ytdlpPath}
            onChange={(e) => updateSetting("ytdlpPath", e.target.value)}
            placeholder="/usr/local/bin/yt-dlp"
          />
        </div>

        {/* PDF Section */}
        <div className="tw-pt-8 tw-text-xl tw-font-semibold">Document Extraction (Docling)</div>
        <div className="tw-mb-2 tw-text-sm tw-text-muted">
          Requires{" "}
          <a
            href="https://github.com/DS4SD/docling"
            target="_blank"
            rel="noreferrer"
            className="tw-text-accent"
          >
            Docling
          </a>{" "}
          to be installed locally to convert PDFs and Office docs to high-quality Markdown.
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-text-sm tw-font-medium">Docling Executable/Python Path</div>
          <div className="tw-mb-1 tw-text-sm tw-text-muted">
            Leave empty to use the system PATH (requires `docling` to be globally accessible).
          </div>
          <Input
            value={settings.doclingPath}
            onChange={(e) => updateSetting("doclingPath", e.target.value)}
            placeholder="docling"
          />
        </div>
      </section>
    </div>
  );
};
