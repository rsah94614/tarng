"use client";

import * as React from "react";
import { communityService, type CommunityMember } from "@/services/communityService";
import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { UserMinus } from "lucide-react";

export default function MembersSettingsPage({ params }: { params: { slug: string } }) {
  const { user } = useAuthStore();
  const [members, setMembers] = React.useState<CommunityMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);

  const loadMembers = async () => {
    try {
      const data = await communityService.getMembers(params.slug);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadMembers();
  }, [params.slug]);

  const me = members.find((m) => m.user_id === user?.id);
  const myRole = me?.role;

  const canManage = (targetRole: string) => {
    if (myRole === "owner") return true;
    if (myRole === "admin" && targetRole !== "owner" && targetRole !== "admin") return true;
    return false;
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (newRole === "remove") {
      handleRemove(userId);
      return;
    }
    
    setUpdatingId(userId);
    try {
      await communityService.updateMemberRole(params.slug, userId, newRole);
      await loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setUpdatingId(userId);
    try {
      await communityService.removeMember(params.slug, userId);
      await loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove member");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  return (
    <div>
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-bold">Manage Members</h2>
        <p className="text-sm text-muted-foreground mt-1">Change roles or remove members from your Wave.</p>
      </div>

      <div className="p-6">
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const isMe = member.user_id === user?.id;
                const isOwner = member.role === "owner";
                const editable = canManage(member.role) && !isMe && !isOwner;

                return (
                  <tr key={member.user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={member.avatar_url} alt={member.username || ""} className="h-8 w-8" />
                        <div>
                          <div className="font-medium text-foreground">{member.display_name || member.username}</div>
                          <div className="text-xs text-muted-foreground">@{member.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === member.user_id && <Spinner size="sm" />}
                        {editable ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                              disabled={updatingId === member.user_id}
                              className="text-sm border rounded-md px-2 py-1.5 bg-background focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              {myRole === "owner" && <option value="admin">Admin</option>}
                            </select>
                            <button
                              onClick={() => handleRemove(member.user_id)}
                              disabled={updatingId === member.user_id}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider
                            ${isOwner ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                              member.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                              member.role === 'moderator' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                              'bg-muted text-muted-foreground'}`
                          }>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No members found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
