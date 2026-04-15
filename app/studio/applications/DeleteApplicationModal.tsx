import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteApplicationModalProps = {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (applicationId: string) => void;
  deletingApplicationId: string | null;
};

export function DeleteApplicationModal({
  applicationId,
  open,
  onOpenChange,
  onConfirm,
  deletingApplicationId,
}: DeleteApplicationModalProps) {
  const busy = applicationId !== null && deletingApplicationId === applicationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this application? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (applicationId) onConfirm(applicationId);
            }}
            disabled={!applicationId || busy}
          >
            {busy ? "Deleting…" : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
