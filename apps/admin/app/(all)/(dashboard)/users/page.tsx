/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Trash2,
  Search,
  Plus,
  X,
  Users,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
// propel components
import { Switch } from "@makeplane/propel/components/switch";
import { setPromiseToast, setToast } from "@plane/blocks/toast";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { Skeleton } from "@/components/common/skeleton";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

interface IInstanceUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login: string | null;
  workspaces: {
    id: string;
    name: string;
    slug: string;
    role: number;
  }[];
}

function DeltaLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 595 554" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M311.318 0.000175227L44.0876 512.313L129.011 554L396.242 41.6873L311.318 0.000175227Z" fill="#21C00F" />
      <path d="M158.504 71.3226L481.726 552.313L561.505 501.862L238.283 20.8709L158.504 71.3226Z" fill="#21C00F" />
      <path d="M1.34268e-05 471.511L591.463 492.851L595 400.585L3.53746 379.245L1.34268e-05 471.511Z" fill="#21C00F" />
    </svg>
  );
}

const InstanceUsersPage = observer(function InstanceUsersPage(_props: Route.ComponentProps) {
  // instance store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  // fetch registered users
  const {
    data: users,
    error: usersError,
    isLoading: isUsersLoading,
    mutate: mutateUsers,
  } = useSWR<IInstanceUser[]>("INSTANCE_USERS", async () => {
    const res = await fetch("/api/instances/users/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  });

  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newMemberInput, setNewMemberInput] = useState<string>("");
  const [allowedUsersList, setAllowedUsersList] = useState<string[]>([]);
  const [isListInitialized, setIsListInitialized] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // current config values
  const isAllowlistEnforced = formattedConfig?.DAUTH_ENFORCE_ALLOWLIST === "1";
  const rawAllowedUsers = formattedConfig?.DAUTH_ALLOWED_USERS ?? "";

  // sync allowed users from instance config on load
  useEffect(() => {
    if (formattedConfig && !isListInitialized) {
      const parsed = rawAllowedUsers
        .split(/[\s,\n;]+/)
        .map((item: string) => item.trim())
        .filter(Boolean);
      setAllowedUsersList(parsed);
      setIsListInitialized(true);
    }
  }, [formattedConfig, rawAllowedUsers, isListInitialized]);

  // toggle allowlist enforcement
  const handleToggleAllowlist = async () => {
    setIsSubmitting(true);
    const nextVal = isAllowlistEnforced ? "0" : "1";
    const promise = updateInstanceConfigurations({
      DAUTH_ENFORCE_ALLOWLIST: nextVal,
    });

    setPromiseToast(promise, {
      loading: "Updating allowlist settings...",
      success: {
        title: "Configuration updated",
        message: () => (nextVal === "1" ? "Delta Member Allowlist is now ACTIVE." : "Allowlist enforcement DISABLED."),
      },
      error: {
        title: "Error",
        message: () => "Failed to update allowlist configuration.",
      },
    });

    try {
      await promise;
      await fetchInstanceConfigurations();
    } finally {
      setIsSubmitting(false);
    }
  };

  // add entry to allowlist
  const handleAddMember = (customToken?: string) => {
    const textToAdd = (customToken ?? newMemberInput).trim();
    if (!textToAdd) return;
    const tokens = textToAdd
      .split(/[\s,\n;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const merged = Array.from(new Set([...allowedUsersList.map((x) => x.toLowerCase()), ...tokens]));
    setAllowedUsersList(merged);
    if (!customToken) {
      setNewMemberInput("");
    }
    setToast({
      type: "success",
      title: "Added to draft",
      message: `Added to draft list. Remember to click "Save Allowlist" to persist.`,
    });
  };

  // remove entry from allowlist
  const handleRemoveMember = (target: string) => {
    const targetLower = target.toLowerCase();
    setAllowedUsersList(allowedUsersList.filter((item) => item.toLowerCase() !== targetLower));
  };

  // save allowlist to server
  const handleSaveAllowlist = async (overrideList?: string[]) => {
    setIsSubmitting(true);
    const listToSave = overrideList ?? allowedUsersList;
    const serialized = listToSave.join(", ");
    const promise = updateInstanceConfigurations({
      DAUTH_ALLOWED_USERS: serialized,
      DAUTH_ENFORCE_ALLOWLIST: isAllowlistEnforced ? "1" : "0",
    });

    setPromiseToast(promise, {
      loading: "Saving allowlist...",
      success: {
        title: "Allowlist saved",
        message: () => `${listToSave.length} member(s) are allowed to sign in via DAuth.`,
      },
      error: {
        title: "Error",
        message: () => "Failed to save member allowlist.",
      },
    });

    try {
      await promise;
      await fetchInstanceConfigurations();
    } finally {
      setIsSubmitting(false);
    }
  };

  // quick seed all currently registered users
  const handleSeedRegisteredUsers = () => {
    if (!users || users.length === 0) return;
    const currentEmails = users.map((u) => u.email.trim().toLowerCase());
    const merged = Array.from(new Set([...allowedUsersList.map((x) => x.toLowerCase()), ...currentEmails]));
    setAllowedUsersList(merged);
    setToast({
      type: "info",
      title: "Users added to draft",
      message: `${currentEmails.length} registered user email(s) added. Click 'Save Allowlist' to save.`,
    });
  };

  // toggle user active status (deactivate / activate)
  const handleToggleUserActive = async (user: IInstanceUser) => {
    setActionInProgressId(user.id);
    const newActive = !user.is_active;
    try {
      const res = await fetch(`/api/instances/users/${user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!res.ok) throw new Error("Failed to update user status");
      await mutateUsers();
      setToast({
        type: "success",
        title: "Status updated",
        message: `Account for ${user.email} is now ${newActive ? "active" : "deactivated"}.`,
      });
    } catch {
      setToast({
        type: "error",
        title: "Error",
        message: "Failed to update user active status.",
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // delete user account
  const handleDeleteUser = async (user: IInstanceUser) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the account for "${user.email}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    setActionInProgressId(user.id);
    try {
      const res = await fetch(`/api/instances/users/${user.id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete user");
      }
      await mutateUsers();
      // Also remove from allowlist if present
      const userEmail = user.email.toLowerCase();
      handleRemoveMember(userEmail);
      setToast({
        type: "success",
        title: "User deleted",
        message: `Account for ${user.email} has been permanently removed.`,
      });
    } catch (err: any) {
      setToast({
        type: "error",
        title: "Error",
        message: err?.message || "Failed to delete user account.",
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // filter registered users by search
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const allowedSet = useMemo(() => new Set(allowedUsersList.map((x) => x.toLowerCase())), [allowedUsersList]);

  // check if a user is in allowlist
  const isUserWhitelisted = (user: IInstanceUser) => {
    const userEmail = user.email.toLowerCase();
    const localPart = userEmail.split("@")[0];
    return user.is_superuser || allowedSet.has(userEmail) || Boolean(localPart && allowedSet.has(localPart));
  };

  return (
    <PageWrapper
      header={{
        title: "Users & Member Access Control",
        description: "Manage registered instance users and restrict DAuth login to authorized Delta Force members.",
      }}
    >
      <div className="space-y-6">
        {/* Delta Member Allowlist Section */}
        <div className="shadow-sm flex flex-col gap-5 rounded-lg border border-subtle bg-surface-1 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <DeltaLogo className="size-10 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-16 font-semibold text-primary">Enforce Delta Member Allowlist</h3>
                  {isAllowlistEnforced ? (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-11 font-medium">
                      <span className="bg-emerald-500 size-1.5 rounded-full" />
                      Enforced (Club Only)
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-11 font-medium">
                      <span className="bg-amber-500 size-1.5 rounded-full" />
                      Open to all NITT DAuth
                    </span>
                  )}
                </div>
                <p className="mt-1 text-13 text-secondary">
                  When enabled, only roll numbers and email addresses on the allowlist can log into Plane. Unauthorized
                  users will be blocked with an access restricted banner.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                aria-label="Toggle allowlist enforcement"
                checked={isAllowlistEnforced}
                onCheckedChange={handleToggleAllowlist}
                size="sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Member Allowlist Editor */}
          <div className="border-t border-subtle pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-13 font-semibold text-primary">Authorized Roll Numbers & Emails</span>
                <p className="text-11 text-tertiary">
                  Add roll numbers (e.g. <span className="font-mono">106121001</span>) or webmail IDs (e.g.{" "}
                  <span className="font-mono">barath@delta.nitt.edu</span>).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSeedRegisteredUsers}
                  disabled={!users || users.length === 0}
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface-2 px-3 py-1.5 text-12 font-medium text-primary transition-colors hover:bg-surface-1 focus:outline-none disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  Add All Active Users
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAllowlist()}
                  disabled={isSubmitting}
                  className="bg-emerald-600 shadow-sm hover:bg-emerald-500 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-12 font-medium text-white transition-colors focus:outline-none disabled:opacity-50"
                >
                  <CheckCircle2 className="size-3.5" />
                  Save Allowlist
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Enter roll numbers or emails (comma, space, or newline separated)..."
                value={newMemberInput}
                onChange={(e) => setNewMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                className="focus:border-primary flex-1 rounded-md border border-subtle bg-surface-2 px-3 py-1.5 text-13 text-primary placeholder:text-tertiary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddMember()}
                className="shadow-sm inline-flex items-center gap-1.5 rounded-md bg-accent-primary px-3.5 py-1.5 text-12 font-medium text-on-color transition-colors hover:opacity-90 focus:outline-none"
              >
                <Plus className="size-3.5" />
                Add to List
              </button>
            </div>

            {/* Chips List */}
            <div className="mt-3 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-subtle bg-surface-2 p-2.5">
              {allowedUsersList.length === 0 ? (
                <div className="py-2 text-12 text-tertiary">
                  No members in allowlist. Enter roll numbers above or click &quot;Add All Active Users&quot; to seed.
                </div>
              ) : (
                allowedUsersList.map((item) => (
                  <span
                    key={item}
                    className="font-mono shadow-xs inline-flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1 text-12 text-primary"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(item)}
                      className="hover:text-danger rounded-full p-0.5 text-tertiary hover:bg-surface-2 focus:outline-none"
                      title="Remove member"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-11 text-tertiary">
              <span>Total allowed entries: {allowedUsersList.length}</span>
              <span>Instance Administrators are always allowed by default.</span>
            </div>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="shadow-sm rounded-lg border border-subtle bg-surface-1 p-5">
          <div className="flex flex-col gap-3 border-b border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-tertiary" />
              <div>
                <h3 className="text-16 font-semibold text-primary">Registered Users</h3>
                <p className="text-11 text-tertiary">Members who have logged into this Plane instance.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:border-primary w-56 rounded-md border border-subtle bg-surface-2 py-1 pr-3 pl-8 text-12 text-primary placeholder:text-tertiary focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => mutateUsers()}
                disabled={isUsersLoading}
                className="flex size-7 items-center justify-center rounded-md border border-subtle bg-surface-2 text-secondary transition-colors hover:bg-surface-1 hover:text-primary focus:outline-none"
                title="Refresh list"
              >
                <RefreshCw className={`size-3.5 ${isUsersLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table / List */}
          {isUsersLoading ? (
            <div className="py-8">
              <Skeleton className="space-y-4">
                <Skeleton.Item height="40px" />
                <Skeleton.Item height="40px" />
                <Skeleton.Item height="40px" />
              </Skeleton>
            </div>
          ) : usersError ? (
            <div className="text-danger py-8 text-center text-13">Failed to load users list.</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-13 text-tertiary">
              {searchQuery ? "No users matching your search." : "No registered users yet."}
            </div>
          ) : (
            <div className="divide-y divide-subtle">
              {filteredUsers.map((user) => {
                const whitelisted = isUserWhitelisted(user);
                const isWorking = actionInProgressId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex size-9 items-center justify-center rounded-full text-13 font-semibold">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-13 font-medium text-primary">
                            {user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
                          </span>
                          {user.is_superuser && (
                            <span className="bg-blue-500/10 py-0.2 text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 rounded-full px-2 text-10 font-medium">
                              <ShieldCheck className="size-3" />
                              Admin
                            </span>
                          )}
                          {isAllowlistEnforced &&
                            (whitelisted ? (
                              <span className="bg-emerald-500/10 py-0.2 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 rounded-full px-2 text-10 font-medium">
                                <UserCheck className="size-3" />
                                Whitelisted
                              </span>
                            ) : (
                              <span className="bg-amber-500/10 py-0.2 text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 rounded-full px-2 text-10 font-medium">
                                Unlisted
                              </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-12 text-tertiary">
                          <span className="font-mono">{user.email}</span>
                          <span>•</span>
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 text-12">
                      {user.workspaces && user.workspaces.length > 0 && (
                        <span className="mr-1 hidden rounded-md bg-surface-2 px-2 py-1 text-11 text-tertiary sm:inline-block">
                          {user.workspaces.length} workspace{user.workspaces.length > 1 ? "s" : ""}
                        </span>
                      )}

                      {/* Quick Whitelist Button */}
                      {!user.is_superuser &&
                        (!whitelisted ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddMember(user.email);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-2 px-2 py-1 text-11 font-medium text-primary transition-colors hover:bg-surface-1 focus:outline-none"
                            title="Add user's email to allowlist"
                          >
                            <UserPlus className="size-3" />
                            Allowlist
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(user.email)}
                            className="hover:text-danger inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-2 px-2 py-1 text-11 font-medium text-tertiary transition-colors focus:outline-none"
                            title="Remove user's email from allowlist"
                          >
                            <X className="size-3" />
                            Remove
                          </button>
                        ))}

                      {/* Deactivate / Activate Button */}
                      {!user.is_superuser && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(user)}
                          disabled={isWorking}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-11 font-medium transition-colors focus:outline-none ${
                            user.is_active
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 border"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 border"
                          }`}
                        >
                          {user.is_active ? <UserX className="size-3" /> : <UserCheck className="size-3" />}
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}

                      {/* Delete Account Button */}
                      {!user.is_superuser && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isWorking}
                          className="border-danger/20 bg-danger/10 text-danger hover:bg-danger/20 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-11 font-medium transition-colors focus:outline-none"
                          title="Permanently delete user account"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      )}

                      {/* Status indicator badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-11 font-medium ${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-danger"}`} />
                        {user.is_active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Users & Access Control - Plane God Mode" }];

export default InstanceUsersPage;
