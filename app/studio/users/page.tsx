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
import { getAllBrands } from "@/lib/services/brandService";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  owned_brands: string[];
  created_at: string;
  updated_at: string;
}

interface UserWithBrands extends UserProfile {
  brandNames: string[];
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

        if (!supabase) {
          toast.error("Database connection not available");
          return;
        }

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (usersError) {
          console.error("Error fetching users:", usersError);
          toast.error("Failed to load users");
          return;
        }

        // Fetch all brands
        const brandsData = await getAllBrands();
        setBrands(brandsData);

        // Map users with brand names
        const usersWithBrands: UserWithBrands[] = usersData.map((user) => ({
          ...user,
          brandNames: user.owned_brands
            ? user.owned_brands
                .map(
                  (brandId: string) =>
                    brandsData.find((brand) => brand.id === brandId)?.name
                )
                .filter(Boolean)
            : [],
        }));

        setUsers(usersWithBrands);
        setFilteredUsers(usersWithBrands);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
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
          user.brandNames.some((brandName) =>
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

    if (!supabase) {
      toast.error("Database connection not available");
      return;
    }

    try {
      setIsLoading(true);

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", formData.email)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking user:", checkError);
        toast.error("Error checking if user exists");
        return;
      }

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from("profiles")
          .update({
            role: formData.role,
            owned_brands: formData.selectedBrands,
            updated_at: new Date().toISOString(),
          })
          .eq("email", formData.email)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError);
          toast.error("Failed to update user");
          return;
        }

        toast.success("User updated successfully");
      } else {
        // Create new user profile
        const { data: newUser, error: createError } = await supabase
          .from("profiles")
          .insert({
            email: formData.email,
            role: formData.role,
            owned_brands: formData.selectedBrands,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          toast.error("Failed to create user");
          return;
        }

        toast.success("User created successfully");
      }

      // Reset form and close dialog
      setFormData({
        email: "",
        role: "user",
        selectedBrands: [],
      });
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

    if (!supabase) {
      toast.error("Database connection not available");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
        return;
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
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

  if (user?.role !== "super_admin") {
    return <Loading />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-canela text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-oma-cocoa/80 mb-8">
            Manage user accounts and assign brands to users
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-oma-plum hover:bg-oma-plum/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign them to brands
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="brand_admin">Brand Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Brands</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2">
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-oma-plum hover:bg-oma-plum/90"
                >
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
            <Table>
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
                        {user.brandNames.length > 0 ? (
                          user.brandNames.map((brandName, index) => (
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
                          onClick={() => {
                            setFormData({
                              email: user.email,
                              role: user.role,
                              selectedBrands: user.owned_brands || [],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
