"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, getProfile } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import {
  getUserPermissions,
  type Permission,
} from "@/lib/services/permissionsService";

const NAME_MAX_LEN = 200;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const [profileData, userPermissions] = await Promise.all([
          getProfile(user.id),
          getUserPermissions(user.id),
        ]);
        setPermissions(userPermissions);
        if (profileData) {
          setFormData({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            email: profileData.email || user.email || "",
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile data");
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSuccess(null);
    setError(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("You must be logged in to update your profile");
      setUpdating(false);
      return;
    }

    const first_name = formData.first_name.trim();
    const last_name = formData.last_name.trim();

    if (first_name.length > NAME_MAX_LEN || last_name.length > NAME_MAX_LEN) {
      setError(`Names must be ${NAME_MAX_LEN} characters or fewer.`);
      setUpdating(false);
      return;
    }

    try {
      await updateProfile(user.id, {
        first_name,
        last_name,
      });
      setFormData((prev) => ({ ...prev, first_name, last_name }));
      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Could not sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loading />
        <p className="text-sm text-oma-cocoa/80">Loading your profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h1 className="mb-4 font-canela text-3xl">Not Logged In</h1>
        <p className="mb-8 text-oma-cocoa/80">
          Please log in to view your profile.
        </p>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-12">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="mb-8 font-canela text-3xl text-oma-plum">
          Your Profile
        </h1>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-8 rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="first_name"
                  className="mb-1 block text-sm font-medium text-oma-cocoa"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={NAME_MAX_LEN}
                  autoComplete="given-name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="mb-1 block text-sm font-medium text-oma-cocoa"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  maxLength={NAME_MAX_LEN}
                  autoComplete="family-name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-oma-cocoa"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-oma-cocoa/80"
              />
              <p className="mt-1 text-xs text-oma-cocoa/70">
                Email cannot be changed here. For account email updates,{" "}
                <Link
                  href="/contact"
                  className="text-oma-plum underline-offset-2 hover:underline"
                >
                  contact support
                </Link>
                .
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-oma-plum hover:bg-oma-plum/90"
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>

        {permissions !== null && (
          <div className="mb-8 rounded-lg border border-oma-plum/10 bg-white p-8 shadow-md">
            <h2 className="mb-2 font-canela text-xl text-oma-plum">
              Brands &amp; collections
            </h2>
            {permissions.includes("studio.access") ? (
              <>
                <p className="mb-4 text-sm text-oma-cocoa/80">
                  Your profile is separate from the studio where you manage
                  brands and upload collections. Open Studio to continue, then
                  use{" "}
                  <span className="font-medium text-oma-cocoa">Collections</span>{" "}
                  in the sidebar to create or edit a collection.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    asChild
                    className="w-full bg-oma-plum hover:bg-oma-plum/90 sm:w-auto"
                  >
                    <Link href="/studio">Open Studio</Link>
                  </Button>
                  {(permissions.includes("studio.catalogues.manage") ||
                    permissions.includes("studio.catalogues.create")) && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-oma-plum text-oma-plum hover:bg-oma-plum/5 sm:w-auto"
                    >
                      <Link href="/studio/collections/create">
                        Create a collection
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-oma-cocoa/80">
                  There isn&apos;t another step on this page after you save your
                  name. Uploading a collection happens in{" "}
                  <span className="font-medium text-oma-cocoa">Studio</span>,
                  which is enabled when your account is set up as a brand or
                  creator on our side.
                </p>
                <p className="mb-4 text-sm text-oma-cocoa/80">
                  If you&apos;re joining as a brand or creator and expected
                  studio access already, please{" "}
                  <Link
                    href="/contact"
                    className="text-oma-plum underline underline-offset-2 hover:text-oma-plum/90"
                  >
                    contact us
                  </Link>{" "}
                  so we can enable the right permissions for your email.
                </p>
                <Button asChild variant="outline" className="border-oma-cocoa/30">
                  <Link href="/how-it-works">How OmaHub works</Link>
                </Button>
              </>
            )}
          </div>
        )}

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Account Settings</h2>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-lg font-medium">Sign Out</h3>
            <p className="mb-4 text-oma-cocoa">
              Sign out of your account on this device.
            </p>
            <Button
              type="button"
              onClick={handleSignOut}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
