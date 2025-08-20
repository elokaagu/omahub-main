"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllBrands, getBrandNamesMap } from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Mail,
  Building,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  owned_brands: string[];
  created_at: string;
  updated_at: string;
}

interface UserWithBrands extends UserProfile {
  brand_names: string[];
}

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithBrands[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithBrands[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithBrands | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
    selectedBrands: [] as string[],
  });

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch users and brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch users and brand names in parallel for better performance
        // Use getBrandNamesMap for lighter payload since we only need names
        const [usersResponse, brandNamesMap, brandsData] = await Promise.all([
          fetch("/api/admin/users", {
            credentials: "include",
          }),
          getBrandNamesMap(), // Lightweight brand names only
          getAllBrands(), // Full brand data for the form dropdown
        ]);

        if (!usersResponse.ok) {
          const errorData = await usersResponse.json();
          console.error("Error fetching users:", errorData);
          toast.error("Failed to load users");
          return;
        }

        const { users: usersData } = await usersResponse.json();
        setBrands(brandsData); // Full brand data for form

        // Map users with brand names using the pre-built Map for O(1) performance
        const usersWithBrands: UserWithBrands[] = usersData.map(
          (user: UserProfile) => ({
            ...user,
            brand_names: user.owned_brands
              ? (user.owned_brands
                  .map((brandId: string) => brandNamesMap.get(brandId))
                  .filter(Boolean) as string[])
              : [],
          })
        );

        setUsers(usersWithBrands);
        setFilteredUsers(usersWithBrands);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchData();
    }
  }, [user]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.brand_names.some((brandName) =>
            brandName.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBrandToggle = (brandId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brandId)
        ? prev.selectedBrands.filter((id) => id !== brandId)
        : [...prev.selectedBrands, brandId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          owned_brands: formData.selectedBrands,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error submitting form:", result);
        toast.error(result.error || "Failed to save user");
        return;
      }

      // Show success message with auto-assignment info for super admins
      if (result.autoAssignedBrands > 0) {
        toast.success(
          `${result.action === "updated" ? "User updated" : "User created"} successfully! Auto-assigned ${result.autoAssignedBrands} brands to super admin.`
        );
      } else {
        const actionText = result.action === "updated" ? "updated" : "created";
        const brandText =
          formData.selectedBrands.length > 0
            ? ` with ${formData.selectedBrands.length} brand${formData.selectedBrands.length === 1 ? "" : "s"}`
            : "";

        toast.success(`User ${actionText} successfully${brandText}!`, {
          description: result.profileRefreshTriggered
            ? "The user will receive a real-time notification of their updated permissions."
            : "Changes will take effect on their next login.",
          duration: 5000,
        });
      }

      // Reset form and close dialog
      setFormData({
        email: "",
        role: "user",
        selectedBrands: [],
      });
      setEditingUser(null);
      setIsDialogOpen(false);

      // Refresh users list
      window.location.reload();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error deleting user:", result);
        toast.error(result.error || "Failed to delete user");
        return;
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setFilteredUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleEditUser = (userToEdit: UserWithBrands) => {
    // Normalize the role to handle any legacy brand_owner roles
    const normalizedRole =
      userToEdit.role === "brand_owner" ? "brand_admin" : userToEdit.role;

    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      role: normalizedRole,
      selectedBrands: userToEdit.owned_brands || [],
    });
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      role: "user",
      selectedBrands: [],
    });
    setIsDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-oma-plum text-white";
      case "brand_admin":
        return "bg-blue-500 text-white";
      case "admin":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  const handleSyncSuperAdminBrands = async () => {
    if (
      !confirm("This will assign all brands to all super admins. Continue?")
    ) {
      return;
    }

    try {
      setIsSyncing(true);

      const response = await fetch("/api/admin/sync-super-admin-brands", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error syncing super admin brands:", result);
        toast.error(result.error || "Failed to sync super admin brands");
        return;
      }

      toast.success(
        `Sync completed! Updated ${result.summary.successful}/${result.summary.totalSuperAdmins} super admins with ${result.summary.totalBrandsAdded} brand assignments.`
      );

      // Refresh users list
      window.location.reload();
    } catch (error) {
      console.error("Error syncing super admin brands:", error);
      toast.error("Failed to sync super admin brands");
    } finally {
      setIsSyncing(false);
    }
  };

  // Test real-time profile updates
  const testRealTimeUpdate = async (userId: string, email: string) => {
    try {
      console.log("🧪 Testing real-time profile update for:", email);

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
          role: "brand_admin",
          owned_brands: ["ehbs-couture"], // Test with a known brand
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Test failed:", result);
        toast.error("Real-time update test failed");
        return;
      }

      console.log("✅ Test successful:", result);
      toast.success("Real-time update test completed!", {
        description: result.profileRefreshTriggered
          ? "Profile refresh notification was sent successfully."
          : "Update completed but no real-time notification was sent.",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Test error:", error);
      toast.error("Real-time update test encountered an error");
    }
  };

  if (user?.role !== "super_admin") {
    return <Loading />;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="border border-gray-200 rounded-lg bg-white">
          <div className="p-6 border-b">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-oma-cocoa/80 mb-8">
            Manage user accounts and assign brands to users
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleSyncSuperAdminBrands}
            disabled={isSyncing}
            className="text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync Super Admins"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
                onClick={handleAddUser}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Add New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user account and brand assignments"
                    : "Create a new user account and assign them to brands"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={!!editingUser} // Disable email editing for existing users
                  />
                  {editingUser && (
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed for existing users
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  {/* Primary Select component */}
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      console.log("Role changed to:", value);
                      handleInputChange("role", value);
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      onClick={() => console.log("SelectTrigger clicked")}
                    >
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={4}>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="brand_admin">Brand Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Fallback radio buttons if Select fails */}
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Alternative selection:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role-fallback"
                          value="user"
                          checked={formData.role === "user"}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">User</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role-fallback"
                          value="brand_admin"
                          checked={formData.role === "brand_admin"}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Brand Admin</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role-fallback"
                          value="admin"
                          checked={formData.role === "admin"}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Admin</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role-fallback"
                          value="super_admin"
                          checked={formData.role === "super_admin"}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Super Admin</span>
                      </label>
                    </div>
                  </div>

                  {/* Debug info */}
                  {process.env.NODE_ENV === "development" && (
                    <p className="text-xs text-gray-500">
                      Current role: {formData.role} | User role:{" "}
                      {editingUser?.role}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assign Brands</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {brands.map((brand) => (
                      <div
                        key={brand.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`brand-${brand.id}`}
                          checked={formData.selectedBrands.includes(brand.id)}
                          onChange={() => handleBrandToggle(brand.id)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {brand.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Super admins will be automatically assigned to all
                    brands
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-oma-plum hover:bg-oma-plum/90"
                  >
                    {isLoading
                      ? editingUser
                        ? "Updating..."
                        : "Creating..."
                      : editingUser
                        ? "Update User"
                        : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-oma-cocoa/60" />
          <Input
            placeholder="Search by email or brand name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="brand_admin">Brand Admins</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || roleFilter !== "all") && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-l-4 border-l-oma-plum border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              {roleFilter === "all" ? "Total Users" : "Filtered Users"}
            </CardTitle>
            <Users className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {filteredUsers.length}
            </div>
            {roleFilter !== "all" && (
              <p className="text-xs text-oma-cocoa/60 mt-1">
                of {users.length} total
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Brand Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {filteredUsers.filter((u) => u.role === "brand_admin").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Regular Users
            </CardTitle>
            <Users className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {filteredUsers.filter((u) => u.role === "user").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Super Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {filteredUsers.filter((u) => u.role === "super_admin").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border border-oma-gold/10 bg-white">
        <CardHeader>
          <CardTitle className="text-black">
            {roleFilter === "all"
              ? "All Users"
              : `${roleFilter.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}s`}
            {searchTerm && (
              <span className="text-sm font-normal text-oma-cocoa/70 ml-2">
                matching "{searchTerm}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-oma-cocoa/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                No users found
              </h3>
              <p className="text-oma-cocoa/60">
                {searchTerm || roleFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No users have been created yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Brands</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-oma-cocoa/60" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.role === "super_admin" ? (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-oma-plum text-white"
                            >
                              <Building className="h-3 w-3 mr-1" />
                              All brands
                            </Badge>
                          ) : user.brand_names.length > 0 ? (
                            user.brand_names.map((brandName, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-oma-beige text-oma-plum"
                              >
                                <Building className="h-3 w-3 mr-1" />
                                {brandName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-oma-cocoa/60 text-sm">
                              No brands assigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-oma-cocoa/70">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDeleteUser(user.id, user.email)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Mobile card layout */}
              <div className="sm:hidden flex flex-col gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg border border-oma-gold/10 bg-white p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-base font-medium">
                      <Mail className="h-4 w-4 text-oma-cocoa/60" />
                      <span className="break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-xs text-oma-cocoa/60 ml-2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.role === "super_admin" ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-oma-plum text-white"
                        >
                          <Building className="h-3 w-3 mr-1" />
                          All brands
                        </Badge>
                      ) : user.brand_names.length > 0 ? (
                        user.brand_names.map((brandName, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-oma-beige text-oma-plum"
                          >
                            <Building className="h-3 w-3 mr-1" />
                            {brandName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-oma-cocoa/60 text-sm">
                          No brands assigned
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="ml-1">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
