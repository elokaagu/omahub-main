import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import type { BrandEditorApi } from "./useBrandEditor";

const categoryOptions = getAllCategoryNames();

export function BrandEditTailoringSection({
  editor,
}: {
  editor: BrandEditorApi;
}) {
  const {
    brand,
    tailor,
    tailorModalOpen,
    setTailorModalOpen,
    tailorSpecialties,
    setTailorSpecialties,
    tailorPriceRange,
    setTailorPriceRange,
    tailorConsultationFee,
    setTailorConsultationFee,
    tailorLeadTime,
    setTailorLeadTime,
    tailorSaving,
    handleTailorSave,
    disableTailoring,
    handleDisableTailoring,
    selectedCategory,
    setSelectedCategory,
    selectedCategories,
    setSelectedCategories,
  } = editor;

  if (!brand) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Tailoring</CardTitle>
        <CardDescription>
          Enable or edit tailoring options for this brand
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tailor ? (
          <div className="space-y-4">
            <div className="p-4 bg-oma-beige border border-oma-plum rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-oma-plum mr-2" />
                  <span className="text-oma-plum font-medium">
                    Tailoring Enabled
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTailorModalOpen(true)}
                  className="text-oma-plum border-oma-plum hover:bg-oma-beige"
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 text-sm text-oma-plum">
                <p>
                  Specialties:{" "}
                  {tailorSpecialties.length > 0
                    ? tailorSpecialties.join(", ")
                    : "None specified"}
                </p>
                <p>Price Range: {tailorPriceRange || "Not specified"}</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-oma-plum border-oma-plum hover:bg-oma-beige"
                  disabled={disableTailoring}
                >
                  {disableTailoring ? "Disabling..." : "Disable Tailoring"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Tailoring</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disable tailoring for this brand?
                    This will remove all tailoring services and the brand will no
                    longer appear in the tailor directory or service creation
                    forms.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisableTailoring}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Disable Tailoring
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">
              No tailoring options configured for this brand.
            </p>
            <Button
              variant="outline"
              onClick={() => setTailorModalOpen(true)}
              className="w-full text-oma-plum border-oma-plum hover:bg-oma-beige"
            >
              Enable Tailoring
            </Button>
          </div>
        )}

        <Dialog open={tailorModalOpen} onOpenChange={setTailorModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tailor
                  ? "Edit Tailoring Options"
                  : "Enable Tailoring for this Brand"}
              </DialogTitle>
              <DialogDescription>
                {tailor
                  ? "Update tailoring options for this brand. These details will be shown on the brand profile and in the tailor directory."
                  : "Add tailoring options for this brand. These details will be shown on the brand profile and in the tailor directory."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTailorSave} className="space-y-4">
              <div>
                <Label>Specialties</Label>
                <MultiSelect
                  options={[
                    "Bridal",
                    "Custom Design",
                    "Alterations",
                    "Evening Gowns",
                  ]}
                  value={tailorSpecialties}
                  onValueChange={setTailorSpecialties}
                  placeholder="Select specialties"
                />
              </div>
              <div>
                <Label>Price Range</Label>
                <Input
                  value={tailorPriceRange}
                  onChange={(e) => setTailorPriceRange(e.target.value)}
                  placeholder="e.g. $500 - $2,000"
                />
              </div>
              <div>
                <Label>Consultation Fee</Label>
                <Input
                  type="number"
                  value={tailorConsultationFee}
                  onChange={(e) => setTailorConsultationFee(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <Label>Lead Time</Label>
                <Input
                  value={tailorLeadTime}
                  onChange={(e) => setTailorLeadTime(e.target.value)}
                  placeholder="e.g. 2-3 weeks"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categories (optional, multi-select)</Label>
                <MultiSelect
                  options={categoryOptions}
                  value={selectedCategories}
                  onValueChange={setSelectedCategories}
                  placeholder="Select categories"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={tailorSaving}
                  className="bg-oma-black hover:bg-oma-black/90 text-white"
                >
                  {tailorSaving
                    ? "Saving..."
                    : tailor
                      ? "Update Tailoring Profile"
                      : "Save Tailoring Profile"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
