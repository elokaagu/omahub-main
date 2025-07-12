import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clipboard } from "lucide-react";

export default function AboutUsEditor() {
  const [aboutText, setAboutText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/settings/content/about-us")
      .then((res) => res.json())
      .then((data) => setAboutText(data.content || ""))
      .catch(() => toast.error("Failed to load About Us content"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/content/about-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: aboutText }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("About Us content saved!");
    } catch {
      toast.error("Failed to save About Us content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-canela text-oma-plum mb-2">Edit About Us</h1>
      <p className="text-oma-cocoa mb-4">
        Update the About Us text displayed on the public About page.
      </p>
      <Textarea
        value={aboutText}
        onChange={(e) => setAboutText(e.target.value)}
        rows={10}
        placeholder="Enter About OmaHub text..."
        disabled={loading || saving}
        className="mb-4"
      />
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(aboutText);
            toast.success("About Us content copied!");
          }}
          disabled={!aboutText || loading}
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
