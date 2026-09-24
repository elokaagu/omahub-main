"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";

type NewEditionForm = {
  title: string;
  number: string;
  status: "upcoming" | "past";
  dateLabel: string;
  sortDate: string;
  city: string;
  country: string;
};

const EMPTY: NewEditionForm = {
  title: "",
  number: "",
  status: "upcoming",
  dateLabel: "",
  sortDate: "",
  city: "",
  country: "",
};

/**
 * Creates an edition and opens its editor. Only the title is required -
 * everything else (cover, story, gallery, lineup) is filled in afterwards.
 */
export function NewEditionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewEditionForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof NewEditionForm>(
    key: K,
    value: NewEditionForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give the edition a title");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/studio/editions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          number: form.number.trim() || undefined,
          status: form.status,
          dateLabel: form.dateLabel.trim() || undefined,
          sortDate: form.sortDate || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to create the edition");
        return;
      }

      toast.success(`${form.title.trim()} created`);
      setForm(EMPTY);
      setOpen(false);
      router.push(`/studio/editions/${result.slug}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating edition:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New edition
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>New edition</DialogTitle>
            <DialogDescription>
              Only the title is required. You can add the cover, story, gallery
              and lineup next.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-edition-title">Title *</Label>
              <Input
                id="new-edition-title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Unboxed: The Body Edition"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500">
                The web address is made from the title, e.g. /editions/unboxed-the-body-edition
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-edition-number">Edition number</Label>
                <Input
                  id="new-edition-number"
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  placeholder="e.g. 04"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-edition-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    set("status", value as NewEditionForm["status"])
                  }
                >
                  <SelectTrigger id="new-edition-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-edition-date-label">Date label</Label>
                <Input
                  id="new-edition-date-label"
                  value={form.dateLabel}
                  onChange={(e) => set("dateLabel", e.target.value)}
                  placeholder="e.g. Autumn 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-edition-sort-date">Sort date</Label>
                <DatePicker
                  id="new-edition-sort-date"
                  value={form.sortDate}
                  onChange={(value) => set("sortDate", value)}
                />
                <p className="text-xs text-gray-500">Orders the experiences list.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-edition-city">City</Label>
                <Input
                  id="new-edition-city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Lagos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-edition-country">Country</Label>
                <Input
                  id="new-edition-country"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="e.g. Nigeria"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                {saving ? "Creating…" : "Create edition"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
