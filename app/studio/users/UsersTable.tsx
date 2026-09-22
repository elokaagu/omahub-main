"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BlurIn,
  BlurInTableRow,
  blurStagger,
} from "@/components/studio/BlurIn";
import { Building, Edit, Mail, Trash2 } from "lucide-react";
import type { UserWithBrands } from "./types";

function roleBadgeColor(role: string) {
  switch (role) {
    case "super_admin":
      return "bg-oma-plum text-white";
    case "brand_admin":
      return "bg-blue-500 text-white";
    case "admin":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className={roleBadgeColor(role)}>
      {role.replace("_", " ").toUpperCase()}
    </Badge>
  );
}

function BrandBadge({ name, faded }: { name: string; faded?: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={`text-xs ${faded ? "bg-oma-beige/50" : "bg-oma-beige"} text-oma-plum max-w-[120px] truncate`}
    >
      <Building className="h-3 w-3 mr-1 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </Badge>
  );
}

function AssignedBrandsList({
  user,
  expanded,
  onToggleExpanded,
}: {
  user: UserWithBrands;
  expanded: boolean;
  onToggleExpanded: (userId: string) => void;
}) {
  if (user.role === "super_admin") {
    return (
      <Badge variant="secondary" className="text-xs bg-oma-plum text-white">
        <Building className="h-3 w-3 mr-1" />
        All brands
      </Badge>
    );
  }

  if (user.brand_names.length === 0) {
    return (
      <span className="text-oma-cocoa/60 text-sm">No brands assigned</span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {user.brand_names.slice(0, 2).map((name, index) => (
          <BrandBadge key={index} name={name} />
        ))}
      </div>

      {user.brand_names.length > 2 && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs text-oma-cocoa/60 border-oma-cocoa/20"
          >
            +{user.brand_names.length - 2} more
          </Badge>
          <button
            type="button"
            onClick={() => onToggleExpanded(user.id)}
            className="text-xs text-oma-plum hover:text-oma-plum/80 underline cursor-pointer"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        </div>
      )}

      {expanded && user.brand_names.length > 2 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-oma-cocoa/10">
          {user.brand_names.slice(2).map((name, index) => (
            <BrandBadge key={index + 2} name={name} faded />
          ))}
        </div>
      )}
    </div>
  );
}

type UsersTableProps = {
  users: UserWithBrands[];
  expandedIds: ReadonlySet<string>;
  onToggleExpanded: (userId: string) => void;
  onEdit: (user: UserWithBrands) => void;
  onDelete: (user: UserWithBrands) => void;
};

/** Desktop table plus the stacked card layout used on phones. */
export function UsersTable({
  users,
  expandedIds,
  onToggleExpanded,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

  return (
    <div className="overflow-x-auto">
      <Table className="hidden sm:table">
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Assigned Brands</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <BlurInTableRow key={user.id} delay={blurStagger(index)}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-oma-cocoa/60" />
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell>
                <AssignedBrandsList
                  user={user}
                  expanded={expandedIds.has(user.id)}
                  onToggleExpanded={onToggleExpanded}
                />
              </TableCell>
              <TableCell className="text-oma-cocoa/70">
                {formatDate(user.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Edit ${user.email}`}
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    aria-label={`Delete ${user.email}`}
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </BlurInTableRow>
          ))}
        </TableBody>
      </Table>

      <div className="sm:hidden flex flex-col gap-4">
        {users.map((user, index) => (
          <BlurIn
            key={user.id}
            delay={blurStagger(index)}
            className="rounded-lg border border-oma-gold/10 bg-white p-4 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2 text-base font-medium">
              <Mail className="h-4 w-4 text-oma-cocoa/60" />
              <span className="break-all">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span className="text-xs text-oma-cocoa/60 ml-2">
                {formatDate(user.created_at)}
              </span>
            </div>
            <div className="space-y-2">
              <AssignedBrandsList
                user={user}
                expanded={expandedIds.has(user.id)}
                onToggleExpanded={onToggleExpanded}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(user)}
              >
                <Edit className="h-4 w-4" />
                <span className="ml-1">Edit</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1">Delete</span>
              </Button>
            </div>
          </BlurIn>
        ))}
      </div>
    </div>
  );
}
