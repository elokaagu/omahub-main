"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, getProfile } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/services/authService";
import {
  getUserPermissions,
  type Permission,
} from "@/lib/services/permissionsService";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
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
          getUserPermissions(user.id, user.email ?? undefined),
        ]);
        setPermissions(userPermissions);
        if (profileData) {
          setProfile(profileData);
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

    loadProfile();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

    try {
      await updateProfile(user.id, {
        id: user.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-canela mb-4">Not Logged In</h1>
        <p className="text-oma-cocoa/80 mb-8">
          Please log in to view your profile.
        </p>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <a href="/login">Log In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-canela text-oma-plum mb-8">
          Your Profile
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-oma-cocoa mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-oma-cocoa mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-oma-cocoa mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
                disabled
              />
              <p className="text-xs text-oma-cocoa/70 mt-1">
                Email cannot be changed
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
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-oma-plum/10">
            <h2 className="text-xl font-canela text-oma-plum mb-2">
              Brands &amp; collections
            </h2>
            {permissions.includes("studio.access") ? (
              <>
                <p className="text-sm text-oma-cocoa/80 mb-4">
                  Your profile is separate from the studio where you manage
                  brands and upload collections. Open Studio to continue, then
                  use{" "}
                  <span className="text-oma-cocoa font-medium">Collections</span>{" "}
                  in the sidebar to create or edit a collection.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap">
                  <Button
                    asChild
                    className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
                  >
                    <Link href="/studio">Open Studio</Link>
                  </Button>
                  {(permissions.includes("studio.catalogues.manage") ||
                    permissions.includes("studio.catalogues.create")) && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-oma-plum text-oma-plum hover:bg-oma-plum/5 w-full sm:w-auto"
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
                <p className="text-sm text-oma-cocoa/80 mb-3">
                  There isn&apos;t another step on this page after you save your
                  name. Uploading a collection happens in{" "}
                  <span className="text-oma-cocoa font-medium">Studio</span>,
                  which is enabled when your account is set up as a brand or
                  creator on our side.
                </p>
                <p className="text-sm text-oma-cocoa/80 mb-4">
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

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-3">Sign Out</h3>
            <p className="text-oma-cocoa mb-4">
              Sign out of your account on this device.
            </p>
            <Button
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
