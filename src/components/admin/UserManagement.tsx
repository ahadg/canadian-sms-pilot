import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
    UserPlus,
    Edit,
    Trash2,
    Search,
    Shield,
    User,
    Loader2,
    Smartphone,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api";

const API_BASE_URL = import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    assignedSims?: (string | { _id: string; port: number; operator: string; status: string })[];
    createdAt: string;
}

interface SimCard {
    _id?: string;
    slotId?: number;
    imei?: string;
    carrier?: string;
    status: string;
    signalStrength?: number;
    operator?: string;
    dailySent?: number;
    dailyLimit?: number;
    todaySent?: number;
    lastResetDate?: string;
    lastActivity?: string;
    port?: string;
    iccid?: string;
    imsi?: string;
    balance?: string;
    inserted?: boolean;
    phoneNumber?: string;
    simNumber?: string; // For display purposes
}

interface UserFormErrors {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [sims, setSims] = useState<SimCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAssignSimDialogOpen, setIsAssignSimDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user" as 'admin' | 'user',
    });
    const [formErrors, setFormErrors] = useState<UserFormErrors>({});
    const [selectedSims, setSelectedSims] = useState<string[]>([]);

    const { token } = useAuthStore();
    const { toast } = useToast();

    // Fetch users
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch SIM cards
    const fetchSims = async () => {
        try {
            const response = await authFetch('/api/sims');
            console.log("fetchSims response", response);
            if (response) {
                setSims(response.sims || []);
            }
        } catch (error) {
            console.error('Error fetching SIMs:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSims();
    }, []);

    const resetAddUserForm = () => {
        setFormData({ name: "", email: "", password: "", role: "user" });
        setFormErrors({});
    };

    const validateAddUserForm = () => {
        const errors: UserFormErrors = {};
        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!trimmedName) {
            errors.name = "Name is required";
        } else if (trimmedName.length < 2) {
            errors.name = "Name must be at least 2 characters";
        }

        if (!trimmedEmail) {
            errors.email = "Email is required";
        } else if (!emailRegex.test(trimmedEmail)) {
            errors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (!["admin", "user"].includes(formData.role)) {
            errors.role = "Please select a valid role";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddFormFieldChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    // Add user
    const handleAddUser = async () => {
        if (!validateAddUserForm()) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.reason || 'Failed to add user');
            }

            toast({
                title: "Success",
                description: "User added successfully",
            });

            setIsAddDialogOpen(false);
            resetAddUserForm();
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Update user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.reason || 'Failed to update user');
            }

            toast({
                title: "Success",
                description: "User updated successfully",
            });

            setIsEditDialogOpen(false);
            setSelectedUser(null);
            setFormData({ name: "", email: "", password: "", role: "user" });
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to delete user');

            toast({
                title: "Success",
                description: "User deleted successfully",
            });

            fetchUsers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive",
            });
        }
    };

    // Assign SIMs to user
    const handleAssignSims = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser._id}/assign-sims`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ simIds: selectedSims }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.reason || 'Failed to assign SIMs');
            }

            toast({
                title: "Success",
                description: "SIMs assigned successfully",
            });

            setIsAssignSimDialogOpen(false);
            setSelectedUser(null);
            setSelectedSims([]);
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Open edit dialog
    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        });
        setIsEditDialogOpen(true);
    };

    // Open assign SIM dialog
    const openAssignSimDialog = (user: User) => {
        setSelectedUser(user);
        // Handle assignedSims being either array of IDs or array of objects
        const simIds = user.assignedSims?.map((sim: any) =>
            typeof sim === 'string' ? sim : sim._id
        ) || [];
        setSelectedSims(simIds);
        setIsAssignSimDialogOpen(true);
    };

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    console.log("selectedSims", selectedUser);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">
                        Manage users and assign SIM cards
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account and assign a role
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleAddFormFieldChange("name", e.target.value)}
                                    placeholder="John Doe"
                                    aria-invalid={Boolean(formErrors.name)}
                                    className={cn(formErrors.name && "border-destructive focus-visible:ring-destructive")}
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-destructive">{formErrors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleAddFormFieldChange("email", e.target.value)}
                                    placeholder="john@example.com"
                                    aria-invalid={Boolean(formErrors.email)}
                                    className={cn(formErrors.email && "border-destructive focus-visible:ring-destructive")}
                                />
                                {formErrors.email && (
                                    <p className="text-sm text-destructive">{formErrors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleAddFormFieldChange("password", e.target.value)}
                                    placeholder="••••••••"
                                    aria-invalid={Boolean(formErrors.password)}
                                    className={cn(formErrors.password && "border-destructive focus-visible:ring-destructive")}
                                />
                                {formErrors.password && (
                                    <p className="text-sm text-destructive">{formErrors.password}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: 'admin' | 'user') => handleAddFormFieldChange("role", value)}
                                >
                                    <SelectTrigger className={cn(formErrors.role && "border-destructive focus:ring-destructive")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formErrors.role && (
                                    <p className="text-sm text-destructive">{formErrors.role}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddDialogOpen(false);
                                    resetAddUserForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddUser}>Add User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                {/* <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.role === 'admin').length}
                        </div>
                    </CardContent>
                </Card> */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available SIMs</CardTitle>
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sims.filter(sim => sim.status === 'active').length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        A list of all users in the system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Assigned SIMs</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                                            className={cn(
                                                user.role === 'admin' && 'bg-gradient-to-r from-purple-500 to-pink-500'
                                            )}
                                        >
                                            {user.role === 'admin' ? (
                                                <Shield className="mr-1 h-3 w-3" />
                                            ) : (
                                                <User className="mr-1 h-3 w-3" />
                                            )}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {user.assignedSims?.length || 0} SIMs
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openAssignSimDialog(user)}
                                            >
                                                <Smartphone className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteUser(user._id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and role
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser}>Update User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign SIM Dialog */}
            <Dialog open={isAssignSimDialogOpen} onOpenChange={setIsAssignSimDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign SIM Cards</DialogTitle>
                        <DialogDescription>
                            Select SIM cards to assign to {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {sims.map((sim) => {
                                const isSelected = selectedSims.includes(sim._id);
                                return (
                                    <div
                                        key={sim._id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedSims(selectedSims.filter(id => id !== sim._id));
                                            } else {
                                                setSelectedSims([...selectedSims, sim._id]);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">port: {sim.port || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{sim.carrier || sim.operator || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <Badge variant={sim.status === 'active' ? 'default' : 'secondary'}>
                                            {sim.status}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                        {selectedSims.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-muted-foreground">Selected:</span>
                                {selectedSims.map((simId, index) => {
                                    const sim = sims.find(s => s._id === simId);
                                    return (
                                        <Badge key={index} variant="secondary" className="gap-1">
                                            {sim ? `Port ${sim.port} - ${sim.operator || 'N/A'}` : 'Unknown'}
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSims(selectedSims.filter(id => id !== simId));
                                                }}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignSimDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignSims}>
                            Assign {selectedSims.length} SIM{selectedSims.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
