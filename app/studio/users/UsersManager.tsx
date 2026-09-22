"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Filter, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BlurIn } from "@/components/studio/BlurIn";
import { ROLE_OPTIONS, type BrandOption, type UserWithBrands } from "./types";
import {
  buildUsersCsv,
  triggerCsvDownload,
  usersCsvFilename,
} from "./usersCsv";
import { UserFormDialog } from "./UserFormDialog";
import { UsersStatsCards } from "./UsersStatsCards";
import { UsersTable } from "./UsersTable";

type UsersManagerProps = {
  /** Rendered on the server; refreshed with `router.refresh()` after changes. */
  users: UserWithBrands[];
  brandOptions: BrandOption[];
};

export function UsersManager({
  users: serverUsers,
  brandOptions,
}: UsersManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithBrands | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserWithBrands | null>(
    null,
  );
  // Hidden immediately on delete, before the server refresh lands.
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(new Set());

  const users = useMemo(
    () => serverUsers.filter((u) => !removedIds.has(u.id)),
    [serverUsers, removedIds],
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.email.toLowerCase().includes(query) ||
        user.brand_names.some((name) => name.toLowerCase().includes(query));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const openDialog = (user: UserWithBrands | null) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const toggleExpanded = (userId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);

    try {
      const response = await fetch(
        `/api/admin/users?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const result = await response.json();
      if (!response.ok) {
        console.error("Error deleting user:", result);
        toast.error(result.error || "Failed to delete user");
        return;
      }
      toast.success("User deleted successfully");
      setRemovedIds((prev) => new Set(prev).add(id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const exportCsv = () => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export");
      return;
    }
    triggerCsvDownload(
      usersCsvFilename(roleFilter, searchTerm),
      buildUsersCsv(filteredUsers),
    );
    toast.success(`Exported ${filteredUsers.length} row(s)`);
  };

  const hasFilters = searchTerm !== "" || roleFilter !== "all";
  const roleHeading =
    ROLE_OPTIONS.find((option) => option.value === roleFilter)?.plural ??
    "All Users";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 gap-4">
        <BlurIn>
          <div>
            <h1 className="text-3xl font-canela text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600 mb-8">
              Manage user accounts and assign brands to users
            </p>
          </div>
        </BlurIn>
        <Button
          className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
          onClick={() => openDialog(null)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <BlurIn delay={0.08} className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by email or brand name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.plural}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filteredUsers.length === 0}
            className="text-gray-900 border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </BlurIn>

      <BlurIn
        delay={0.12}
        className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <UsersStatsCards
          filteredUsers={filteredUsers}
          totalCount={users.length}
          roleFilter={roleFilter}
        />
      </BlurIn>

      <BlurIn delay={0.16}>
        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-black">
              {roleHeading}
              {searchTerm && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  matching &quot;{searchTerm}&quot;
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No users found
                </h3>
                <p className="text-gray-500">
                  {hasFilters
                    ? "Try adjusting your search or filter criteria."
                    : "No users have been created yet."}
                </p>
              </div>
            ) : (
              <UsersTable
                users={filteredUsers}
                expandedIds={expandedIds}
                onToggleExpanded={toggleExpanded}
                onEdit={openDialog}
                onDelete={setPendingDelete}
              />
            )}
          </CardContent>
        </Card>
      </BlurIn>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        brandOptions={brandOptions}
        onSaved={() => router.refresh()}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{pendingDelete?.email}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
