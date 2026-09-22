"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_OPTIONS, type BrandOption, type UserWithBrands } from "./types";

type FormState = { email: string; role: string; selectedBrands: string[] };

const EMPTY_FORM: FormState = { email: "", role: "user", selectedBrands: [] };

function formFor(user: UserWithBrands | null): FormState {
  if (!user) return EMPTY_FORM;
  return {
    email: user.email,
    // Legacy `brand_owner` rows are edited as brand admins.
    role: user.role === "brand_owner" ? "brand_admin" : user.role,
    selectedBrands: user.owned_brands || [],
  };
}

type SaveResult = {
  action?: "created" | "updated";
  autoAssignedBrands?: number;
  profileRefreshTriggered?: boolean;
  error?: string;
};

function announceSaved(result: SaveResult, brandCount: number) {
  const actionText = result.action === "updated" ? "updated" : "created";
  if (result.autoAssignedBrands && result.autoAssignedBrands > 0) {
    toast.success(
      `User ${actionText} successfully! Auto-assigned ${result.autoAssignedBrands} brands to super admin.`,
    );
    return;
  }
  const brandText =
    brandCount > 0
      ? ` with ${brandCount} brand${brandCount === 1 ? "" : "s"}`
      : "";
  toast.success(`User ${actionText} successfully${brandText}!`, {
    description: result.profileRefreshTriggered
      ? "The user will receive a real-time notification of their updated permissions."
      : "Changes will take effect on their next login.",
    duration: 5000,
  });
}

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new user. */
  editingUser: UserWithBrands | null;
  brandOptions: BrandOption[];
  onSaved: () => void;
};

/** Create / edit a user's email, role and brand assignments. */
export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  brandOptions,
  onSaved,
}: UserFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Start from the chosen user's values each time the dialog opens.
  useEffect(() => {
    if (open) setForm(formFor(editingUser));
  }, [open, editingUser]);

  const toggleBrand = (brandId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brandId)
        ? prev.selectedBrands.filter((id) => id !== brandId)
        : [...prev.selectedBrands, brandId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      toast.error("Please enter an email address");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(editingUser ? { id: editingUser.id } : {}),
          email: form.email,
          role: form.role,
          owned_brands: form.selectedBrands,
        }),
      });
      const result = (await response.json()) as SaveResult;

      if (!response.ok) {
        console.error("Error saving user:", result);
        toast.error(result.error || "Failed to save user");
        return;
      }

      announceSaved(result, form.selectedBrands.length);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update user account and brand assignments"
              : "Create a new user account and assign them to brands"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              required
            />
            {editingUser && (
              <p className="text-xs text-muted-foreground">
                Changing the email will update their login address immediately.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={form.role}
              onValueChange={(role) => setForm((prev) => ({ ...prev, role }))}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={4}>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign Brands</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {brandOptions.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`brand-${brand.id}`}
                    checked={form.selectedBrands.includes(brand.id)}
                    onChange={() => toggleBrand(brand.id)}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm font-medium leading-none"
                  >
                    {brand.name}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Super admins will be automatically assigned to all brands
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              {saving
                ? editingUser
                  ? "Updating..."
                  : "Creating..."
                : editingUser
                  ? "Update User"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
