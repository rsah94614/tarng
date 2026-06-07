"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { communityService } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";

export function CreateWaveForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const wave = await communityService.createCommunity({ name, description });
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
        <h2 className="text-2xl font-bold">Create a new Wave</h2>
        <p className="text-muted-foreground">Waves are communities where people connect over shared interests.</p>
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
            placeholder="e.g. Next.js Developers"
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
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" className="mr-2" /> : null}
        Create Wave
      </button>
    </form>
  );
}
