"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { communityService } from "@/services/communityService";
import type { Community, Template } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";
import * as LucideIcons from "lucide-react";

interface CreateWaveFormProps {
  parentWave?: Community;
}

export function CreateWaveForm({ parentWave }: CreateWaveFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [templateId, setTemplateId] = React.useState<number | "">("");
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchingTemplates, setFetchingTemplates] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    communityService.listTemplates()
      .then((data) => {
        if (mounted) setTemplates(data);
      })
      .catch((err) => console.error("Failed to load templates", err))
      .finally(() => {
        if (mounted) setFetchingTemplates(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const payload = { 
        name, 
        description, 
        parent_id: parentWave?.id,
        template_id: templateId === "" ? undefined : templateId
      };
      const wave = await communityService.createCommunity(payload);
      router.push(`/waves/${wave.slug}`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Failed to create Wave.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-card p-6 rounded-xl border shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {parentWave ? `Create a Sub-Wave in ${parentWave.name}` : "Create a new Wave"}
        </h2>
        <p className="text-muted-foreground">
          {parentWave 
            ? "Sub-waves help organize specific topics within a larger community." 
            : "Waves are communities where people connect over shared interests."}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">Wave Name</label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            placeholder={parentWave ? "e.g. Frontend" : "e.g. Next.js Developers"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            className="flex min-h-[100px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="What is this Wave about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="template">Template (optional)</label>
          {fetchingTemplates ? (
            <div className="flex h-10 w-full items-center px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : (
            <select
              id="template"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">None (Default sections only)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Templates add predefined sections to your Wave automatically.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim() || fetchingTemplates}
        className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" className="mr-2" /> : null}
        Create Wave
      </button>
    </form>
  );
}
