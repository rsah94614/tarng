"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { communityService, type Community } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";
import { Trash2, AlertTriangle } from "lucide-react";

export default function GeneralSettingsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [wave, setWave] = React.useState<Community | null>(null);
  
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    async function load() {
      try {
        const data = await communityService.getCommunity(params.slug);
        setWave(data);
        setName(data.name);
        setDescription(data.description || "");
        setIsPublic(data.is_public);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await communityService.updateCommunity(params.slug, {
        name,
        description: description || undefined,
        is_public: isPublic,
      });
      // Optionally show a success toast here
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("DANGER: Are you sure you want to delete this Wave? This action cannot be undone.")) return;
    try {
      await communityService.deleteCommunity(params.slug);
      router.push("/feed");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete Wave");
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  if (!wave) return null;

  return (
    <div>
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-bold">General Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage basic details about your Wave.</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Wave Name</label>
            <input
              type="text"
              required
              className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this Wave about?"
            />
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
            <input
              type="checkbox"
              id="isPublic"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="isPublic" className="select-none">
              <span className="block font-medium">Public Wave</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                Anyone can view and join this Wave. If unchecked, it will be hidden.
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving && <Spinner size="sm" className="mr-2" />}
              Save Changes
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-destructive/20">
          <h3 className="text-destructive font-bold text-lg mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Archiving or deleting this Wave will hide it from all users and remove access.
          </p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md font-medium hover:bg-destructive hover:text-white transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Wave
          </button>
        </div>
      </div>
    </div>
  );
}
