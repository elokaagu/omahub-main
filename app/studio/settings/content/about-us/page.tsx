"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function AboutUsEditorPage() {
  const [aboutUs, setAboutUs] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load About Us content from Supabase
    const fetchContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("studio_content")
        .select("content")
        .eq("key", "about_us")
        .single();
      if (data) setAboutUs(data.content || "");
      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("studio_content")
      .upsert({ key: "about_us", content: aboutUs });
    setSaving(false);
    if (error) {
      toast({
        title: "Failed to save About Us",
        description: error.message || undefined,
      });
    } else {
      toast({ title: "About Us saved" });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aboutUs);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>About Us</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[200px] border rounded-lg p-3 text-base"
            value={aboutUs}
            onChange={(e) => setAboutUs(e.target.value)}
            placeholder="Write your About Us paragraph here..."
            disabled={loading}
          />
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCopy} variant="outline">
              Copy
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
