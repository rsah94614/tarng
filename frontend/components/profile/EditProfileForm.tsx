"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { userService } from "@/services/userService";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Spinner } from "@/components/ui/Spinner";

export function EditProfileForm() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [displayName, setDisplayName] = React.useState(user?.display_name || "");
  const [bio, setBio] = React.useState(user?.bio || "");
  const [language, setLanguage] = React.useState(user?.language_preference || "en");
  const [interests, setInterests] = React.useState(user?.interests?.join(", ") || "");
  
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Upload avatar if changed
      if (avatarFile) {
        await userService.uploadAvatar(avatarFile);
      }

      // 2. Update profile
      const parsedInterests = interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const updatedUser = await userService.updateProfile({
        displayName,
        bio,
        languagePreference: language,
        interests: parsedInterests.length > 0 ? parsedInterests : undefined,
      });

      setUser(updatedUser);
      router.push(`/profile/${updatedUser.username}`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Failed to update profile.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto p-4 sm:p-6 rounded-xl border bg-card">
      <div>
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <p className="text-muted-foreground">Customize how you appear to others on tarng.</p>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Profile Picture</label>
          <div className="h-32 w-32">
            <ImageUpload
              value={avatarFile}
              onChange={setAvatarFile}
              previewUrl={user.avatar_url}
              className="rounded-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="displayName">Display Name</label>
          <input
            id="displayName" type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="flex min-h-[100px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={bio} onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="language">Language Preference</label>
          <select
            id="language"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={language} onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="interests">Interests (comma separated)</label>
          <input
            id="interests" type="text" placeholder="e.g. coding, music, art"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={interests} onChange={(e) => setInterests(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Save Changes
        </button>
      </div>
    </form>
  );
}
