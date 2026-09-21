"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminHeroGate } from "@/app/studio/hero/SuperAdminHeroGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
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
  deleteSpotlightContent,
  getAllSpotlightContent,
  setSpotlightActiveState,
  type SpotlightContent,
} from "@/lib/services/spotlightService";
import { useStudioEffectiveRole } from "@/hooks/useStudioEffectiveRole";
import { BlurIn, blurStagger } from "@/components/studio/BlurIn";

export default function SpotlightManagementPage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage brand films">
      <SpotlightStudioContent />
    </SuperAdminHeroGate>
  );
}

function SpotlightStudioContent() {
  const { user } = useStudioEffectiveRole();
  const [items, setItems] = useState<SpotlightContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await getAllSpotlightContent());
    } catch (err) {
      console.error("Error fetching spotlight content:", err);
      setError("Could not load brand films.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggleLive = async (item: SpotlightContent) => {
    try {
      setBusyId(item.id);
      const updated = await setSpotlightActiveState(item.id, !item.is_active);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, ...updated } : row)),
      );
      toast.success(
        updated.is_active
          ? `${item.brand_name} film is live on product pages`
          : `${item.brand_name} film is hidden`,
      );
    } catch (err) {
      console.error("Error toggling spotlight:", err);
      toast.error("Could not update this film");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: SpotlightContent) => {
    if (!user) return;
    try {
      setBusyId(item.id);
      await deleteSpotlightContent(user.id, item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      toast.success("Film deleted");
    } catch (err) {
      console.error("Error deleting spotlight:", err);
      toast.error("Could not delete this film");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-oma-cocoa">{error}</p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BlurIn className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 font-canela text-3xl text-oma-black">
            Brand films
          </h1>
          <p className="max-w-xl text-oma-cocoa">
            Still and film used on a designer&apos;s product pages. Live films
            can run at the same time for different brands.
          </p>
        </div>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/studio/spotlight/create">
            <Plus className="mr-2 h-4 w-4" />
            New film
          </Link>
        </Button>
      </BlurIn>

      {items.length === 0 ? (
        <BlurIn delay={0.08}>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="mb-2 font-canela text-xl text-oma-black">
              No brand films yet
            </p>
            <p className="mb-6 text-sm text-oma-cocoa">
              Add a still and optional film, then set it live for that designer.
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/spotlight/create">New film</Link>
            </Button>
          </CardContent>
        </Card>
        </BlurIn>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const preview = item.video_thumbnail || item.main_image;
            return (
              <BlurIn key={item.id} delay={blurStagger(index)}>
              <Card className="overflow-hidden border-oma-beige/80">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative aspect-[4/5] bg-oma-beige/40 sm:aspect-auto sm:w-40 sm:shrink-0">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[10rem] items-center justify-center text-xs text-oma-cocoa">
                        No still
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-canela text-xl text-oma-black">
                          {item.title || item.brand_name}
                        </h2>
                        {item.is_active ? (
                          <Badge className="border-0 bg-oma-plum text-white">
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-oma-cocoa">
                            Hidden
                          </Badge>
                        )}
                        {item.video_url ? (
                          <Badge variant="outline">Film</Badge>
                        ) : (
                          <Badge variant="outline">Still only</Badge>
                        )}
                      </div>
                      <p className="text-sm text-oma-cocoa">{item.brand_name}</p>
                      {item.subtitle ? (
                        <p className="line-clamp-2 text-sm text-oma-cocoa/80">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/studio/spotlight/${item.id}`}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === item.id}
                        onClick={() => void handleToggleLive(item)}
                      >
                        {item.is_active ? "Hide" : "Set live"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busyId === item.id}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this film?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {item.title || item.brand_name} will be removed
                              from Studio
                              {item.is_active
                                ? " and will no longer play on product pages."
                                : "."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => void handleDelete(item)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </div>
              </Card>
              </BlurIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
