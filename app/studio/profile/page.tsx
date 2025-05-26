"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { getProfile, updateProfile, User } from "@/lib/services/authService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon, Save } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

interface ProfileData extends User {
  // Extends the User type from authService
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const profile = await getProfile(user.id);

        if (profile) {
          setProfileData({
            id: user.id,
            email: user.email,
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            avatar_url: profile.avatar_url || "",
            role: profile.role || "admin",
          });
        } else {
          // Create a default profile if none exists
          setProfileData({
            id: user.id,
            email: user.email,
            first_name: "",
            last_name: "",
            avatar_url: "",
            role: "admin",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!profileData) return;

    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleAvatarUpload = (url: string) => {
    if (!profileData) return;

    setProfileData({
      ...profileData,
      avatar_url: url,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData || !user) return;

    setSaving(true);
    try {
      await updateProfile(user.id, {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        avatar_url: profileData.avatar_url,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          Profile not found. Please try logging in again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-canela text-gray-900 mb-8">
        Profile Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and profile
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">
                    Your email address cannot be changed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">
                    Your role in the system determines your access levels
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center mb-6">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt={`${profileData.first_name} ${profileData.last_name}`}
                    className="w-32 h-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  {profileData.first_name} {profileData.last_name}
                </p>
                <p className="text-xs text-gray-500">{profileData.email}</p>
              </div>

              <FileUpload
                onUploadComplete={handleAvatarUpload}
                defaultValue={profileData.avatar_url}
                bucket="profiles"
                path="avatars"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
