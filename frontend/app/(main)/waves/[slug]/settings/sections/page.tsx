"use client";

import * as React from "react";
import { communityService, type Section } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowUp, ArrowDown, Edit2, Trash2, Plus, Eye, EyeOff } from "lucide-react";

export default function SectionsSettingsPage({ params }: { params: { slug: string } }) {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const [editingSlug, setEditingSlug] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editVisible, setEditVisible] = React.useState(true);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const loadSections = async () => {
    try {
      const data = await communityService.getSections(params.slug);
      setSections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSections();
  }, [params.slug]);

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);

    try {
      await communityService.reorderSections(params.slug, newSections.map(s => s.id));
    } catch (err) {
      alert("Failed to reorder sections");
      loadSections(); // revert
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await communityService.createSection(params.slug, {
        name: newName,
        description: newDesc || undefined,
        section_type: "custom",
      });
      setNewName("");
      setNewDesc("");
      setShowAdd(false);
      await loadSections();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add section");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (section: Section) => {
    setEditingSlug(section.slug);
    setEditName(section.name);
    setEditDesc(section.description || "");
    setEditVisible(section.is_visible);
  };

  const saveEdit = async (sectionSlug: string) => {
    setSavingEdit(true);
    try {
      await communityService.updateSection(params.slug, sectionSlug, {
        name: editName,
        description: editDesc || undefined,
        is_visible: editVisible,
      });
      setEditingSlug(null);
      await loadSections();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update section");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (sectionSlug: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await communityService.deleteSection(params.slug, sectionSlug);
      await loadSections();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete section");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  return (
    <div>
      <div className="border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Manage Sections</h2>
          <p className="text-sm text-muted-foreground mt-1">Reorder, hide, or create new sections.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      <div className="p-6">
        {showAdd && (
          <form onSubmit={handleAddSection} className="mb-6 p-4 border rounded-lg bg-muted/20 space-y-4">
            <h3 className="font-medium">Create New Section</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                required
                type="text"
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description (Optional)</label>
              <input
                type="text"
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center"
              >
                {adding && <Spinner size="sm" className="mr-2" />}
                Create
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {sections.map((section, index) => {
            const isEditing = editingSlug === section.slug;

            if (isEditing) {
              return (
                <div key={section.id} className="p-4 border border-primary/50 rounded-lg bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Editing: {section.slug}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Visible</span>
                      <button
                        type="button"
                        onClick={() => setEditVisible(!editVisible)}
                        className={`p-1.5 rounded-md ${editVisible ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"}`}
                      >
                        {editVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full text-sm rounded-md border bg-background px-3 py-1.5"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Description</label>
                    <input
                      type="text"
                      className="w-full text-sm rounded-md border bg-background px-3 py-1.5"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingSlug(null)}
                      className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(section.slug)}
                      disabled={savingEdit}
                      className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center"
                    >
                      {savingEdit && <Spinner size="sm" className="mr-2" />} Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={section.id} className={`flex items-center justify-between p-3 border rounded-lg bg-card transition-colors ${!section.is_visible ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMove(index, "down")}
                      disabled={index === sections.length - 1}
                      className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{section.name}</span>
                      {!section.is_visible && <EyeOff className="h-3 w-3 text-muted-foreground" title="Hidden" />}
                      {section.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded uppercase font-bold tracking-wider">Default</span>}
                    </div>
                    {section.description && <div className="text-xs text-muted-foreground mt-0.5">{section.description}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(section)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {!section.is_default && (
                    <button
                      onClick={() => handleDelete(section.slug)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
