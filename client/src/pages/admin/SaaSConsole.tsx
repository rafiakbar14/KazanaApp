import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    Server,
    Users,
    DollarSign,
    Database,
    Package,
    ShoppingCart,
    Calculator,
    Cpu,
    Truck,
    BarChart3,
    Brain,
    Cloud,
    CreditCard,
    Shield,
    Smartphone,
    Terminal,
    PieChart,
    Bell,
    Mail,
    MessageSquare,
    HelpCircle,
    FileText,
    Code,
    RefreshCw,
    Rocket,
    Crown,
    Activity,
    UserCheck,
    TrendingUp,
    HardDrive,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Eye,
    ShieldAlert
} from "lucide-react";

interface Module {
    id: string;
    name: string;
    description: string;
    price: number;
    status: "active" | "inactive" | "pending" | "expired";
    users: number;
    usage: number;
    lastActive: string;
    icon: string;
    category: string;
}

interface UserSubscription {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    moduleId: string;
    moduleName: string;
    status: "active" | "expired" | "cancelled" | "pending";
    startDate: string;
    endDate: string;
    price: number;
    paymentMethod: string;
    autoRenew: boolean;
}

interface SystemMetrics {
    totalModules: number;
    activeModules: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    uptime: number;
    systemLoad: number;
    storageUsed: number;
    storageTotal: number;
    apiCallsToday: number;
    apiCallsLimit: number;
}

interface Alert {
    id: string;
    type: "warning" | "error" | "info" | "success";
    title: string;
    message: string;
    timestamp: string;
    module: string;
    resolved: boolean;
}

const MODULE_ICONS: Record<string, any> = {
    inventory: Package,
    pos: ShoppingCart,
    accounting: Calculator,
    production: Cpu,
    logistics: Truck,
    reporting: BarChart3,
    analytics: Brain,
    ai: Brain,
    backup: Cloud,
    billing: CreditCard,
    admin: Shield,
    mobile: Smartphone,
    api: Terminal,
    dashboard: PieChart,
    notifications: Bell,
    email: Mail,
    chat: MessageSquare,
    support: HelpCircle,
    docs: FileText,
    developer: Code,
};

export default function SaaSConsole() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch system metrics
    const { data: metrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
        queryKey: ["/api/admin/saas/metrics"],
        queryFn: async () => {
            const res = await fetch("/api/admin/saas/metrics");
            if (!res.ok) throw new Error("Failed to fetch metrics");
            return res.json();
        },
        refetchInterval: 30000,
    });

    // Fetch modules
    const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
        queryKey: ["/api/admin/saas/modules"],
        queryFn: async () => {
            const res = await fetch("/api/admin/saas/modules");
            if (!res.ok) throw new Error("Failed to fetch modules");
            return res.json();
        },
    });

    // Fetch subscriptions
    const { data: subscriptions = [], isLoading: subsLoading } = useQuery<UserSubscription[]>({
        queryKey: ["/api/admin/saas/subscriptions"],
        queryFn: async () => {
            const res = await fetch("/api/admin/saas/subscriptions");
            if (!res.ok) throw new Error("Failed to fetch subscriptions");
            return res.json();
        },
    });

    // Fetch alerts
    const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
        queryKey: ["/api/admin/saas/alerts"],
        queryFn: async () => {
            const res = await fetch("/api/admin/saas/alerts");
            if (!res.ok) throw new Error("Failed to fetch alerts");
            return res.json();
        },
        refetchInterval: 60000,
    });

    // Toggle module status mutation
    const toggleModuleMutation = useMutation({
        mutationFn: async ({ moduleId, status }: { moduleId: string; status: string }) => {
            const res = await fetch(`/api/admin/saas/modules/${moduleId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update module status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/saas/modules"] });
            toast({
                title: "Status Updated",
                description: "Module status has been updated successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Refresh all data
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/admin/saas/metrics"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/admin/saas/modules"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/admin/saas/subscriptions"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/admin/saas/alerts"] }),
        ]);
        setTimeout(() => setIsRefreshing(false), 1000);
        toast({
            title: "Data Refreshed",
            description: "All SaaS console data has been refreshed.",
        });
    };

    // Filter modules
    const filteredModules = modules.filter(module => {
        if (searchTerm && !module.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !module.description.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (statusFilter !== "all" && module.status !== statusFilter) return false;
        return true;
    });

    // Get module icon component
    const getModuleIcon = (iconName: string) => {
        const IconComponent = MODULE_ICONS[iconName] || Package;
        return <IconComponent className="h-5 w-5" />;
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Format percentage
    const formatPercent = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "expired":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Get alert icon
    const getAlertIcon = (type: string) => {
        switch (type) {
            case "warning":
                return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case "error":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "info":
                return <Eye className="h-4 w-4 text-blue-600" />;
            case "success":
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const ALLOWED_USERS = ["rafbarpratama", "smpusat"];
    const isAllowed = user && user.isSuperAdmin === 1 && ALLOWED_USERS.includes(user.username);

    if (!isAllowed) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-6 w-6 text-red-600" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You need administrator privileges to access the SaaS Console.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            This area is restricted to system administrators only. Please contact your administrator if you believe this is an error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Crown className="h-8 w-8 text-amber-600" />
                            SaaS Super Console
                            <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                ADMIN
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Centralized management for all SaaS modules, subscriptions, and system metrics
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Rocket className="h-4 w-4 mr-2" />
                            Quick Actions
                        </Button>
                    </div>
                </div>

                {/* System Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-blue-800">
                                        {metrics ? formatPercent(metrics.uptime) : "Loading..."}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Uptime</p>
                                </div>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${metrics && metrics.systemLoad > 80 ? "bg-red-100 text-red-600" : metrics && metrics.systemLoad > 60 ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                                    <Activity className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Active Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-green-800">
                                        {metrics?.activeUsers?.toLocaleString() ?? "0"}
                                        <span className="text-sm font-normal text-muted-foreground ml-2">
                                            / {metrics?.totalUsers?.toLocaleString() ?? "0"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Total Users</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Monthly Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-purple-800">
                                        {metrics ? formatCurrency(metrics.monthlyRevenue) : "Loading..."}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics ? formatCurrency(metrics.totalRevenue) : "Loading..."} Total
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Storage Usage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-amber-800">
                                        {metrics ? `${((metrics.storageUsed / metrics.storageTotal) * 100).toFixed(1)}%` : "Loading..."}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics ? `${(metrics.storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB / ${(metrics.storageTotal / 1024 / 1024 / 1024).toFixed(2)} GB` : "Loading..."}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <HardDrive className="h-5 w-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="modules" className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full max-w-md">
                        <TabsTrigger value="modules" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Modules
                        </TabsTrigger>
                        <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Subscriptions
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Alerts
                            {alerts.filter(a => !a.resolved).length > 0 && (
                                <Badge className="ml-1 bg-red-500 text-white px-1.5 py-0.5 text-xs">
                                    {alerts.filter(a => !a.resolved).length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    {/* Modules Tab */}
                    <TabsContent value="modules" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Module Management</CardTitle>
                                <CardDescription>
                                    Manage all SaaS modules, their status, and configuration
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Search modules..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="max-w-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="expired">Expired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredModules.map((module) => (
                                            <Card key={module.id} className="hover:shadow-lg transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-blue-50">
                                                                {getModuleIcon(module.icon)}
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-lg">{module.name}</CardTitle>
                                                                <CardDescription className="text-xs">{module.category}</CardDescription>
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(module.status)}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Price:</span>
                                                            <div className="font-medium">{formatCurrency(module.price)}/month</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Users:</span>
                                                            <div className="font-medium">{module.users}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Usage:</span>
                                                            <div className="font-medium">{module.usage}%</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Last Active:</span>
                                                            <div className="font-medium">{formatDate(module.lastActive)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toggleModuleMutation.mutate({
                                                                moduleId: module.id,
                                                                status: module.status === "active" ? "inactive" : "active"
                                                            })}
                                                            disabled={toggleModuleMutation.isPending}
                                                        >
                                                            {module.status === "active" ? "Deactivate" : "Activate"}
                                                        </Button>
                                                        <Button variant="ghost" size="sm">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Subscriptions Tab */}
                    <TabsContent value="subscriptions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Management</CardTitle>
                                <CardDescription>
                                    View and manage all user subscriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {subsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : subscriptions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No subscriptions found
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Module</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Start Date</TableHead>
                                                    <TableHead>End Date</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Auto Renew</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {subscriptions.map((sub) => (
                                                    <TableRow key={sub.id}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{sub.userName}</span>
                                                                <span className="text-xs text-muted-foreground">{sub.userEmail}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{sub.moduleName}</TableCell>
                                                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                                        <TableCell>{formatDate(sub.startDate)}</TableCell>
                                                        <TableCell>{formatDate(sub.endDate)}</TableCell>
                                                        <TableCell>{formatCurrency(sub.price)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={sub.autoRenew ? "default" : "outline"}>
                                                                {sub.autoRenew ? "Yes" : "No"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Alerts Tab */}
                    <TabsContent value="alerts" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Alerts</CardTitle>
                                <CardDescription>
                                    Monitor system alerts and notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {alertsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : alerts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No alerts found
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {alerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={`p-4 rounded-lg border ${alert.resolved ? 'bg-gray-50' : alert.type === 'error' ? 'bg-red-50 border-red-200' : alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : alert.type === 'info' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        {getAlertIcon(alert.type)}
                                                        <div>
                                                            <h4 className="font-medium">{alert.title}</h4>
                                                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                                <span>Module: {alert.module}</span>
                                                                <span>{formatDate(alert.timestamp)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant={alert.resolved ? "outline" : "default"}>
                                                        {alert.resolved ? "Resolved" : "Active"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics Dashboard</CardTitle>
                                <CardDescription>
                                    System performance and usage analytics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm">Module Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {modules.map((module) => (
                                                    <div key={module.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {getModuleIcon(module.icon)}
                                                            <span className="text-sm">{module.name}</span>
                                                        </div>
                                                        <div className="text-sm font-medium">{module.users} users</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm">Revenue Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                                                    <span className="text-sm font-medium">{metrics ? formatCurrency(metrics.monthlyRevenue) : "Loading..."}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                                                    <span className="text-sm font-medium">{metrics ? formatCurrency(metrics.totalRevenue) : "Loading..."}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Active Modules</span>
                                                    <span className="text-sm font-medium">{metrics ? metrics.activeModules : "Loading..."} / {metrics ? metrics.totalModules : "Loading..."}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">API Calls Today</span>
                                                    <span className="text-sm font-medium">{metrics?.apiCallsToday?.toLocaleString() ?? "0"} / {metrics?.apiCallsLimit?.toLocaleString() ?? "0"}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
