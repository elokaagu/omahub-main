import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clipboard } from "lucide-react";

export default function OurStoryEditor() {
  const [storyText, setStoryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/settings/content/our-story")
      .then((res) => res.json())
      .then((data) => setStoryText(data.content || ""))
      .catch(() => toast.error("Failed to load Our Story content"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/content/our-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: storyText }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Our Story content saved!");
    } catch {
      toast.error("Failed to save Our Story content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-canela text-oma-plum mb-2">
        Edit Our Story
      </h1>
      <p className="text-oma-cocoa mb-4">
        Update the Our Story text displayed on the About OmaHub page.
      </p>
      <Textarea
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
        rows={10}
        placeholder="Enter Our Story text..."
        disabled={loading || saving}
        className="mb-4"
      />
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(storyText);
            toast.success("Our Story content copied!");
          }}
          disabled={!storyText || loading}
          className="flex items-center gap-2"
        >
          <Clipboard className="w-4 h-4" /> Content Copy
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || saving}
          className="bg-oma-plum text-white"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
