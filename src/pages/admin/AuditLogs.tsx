import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, LogIn, LogOut, ShieldAlert } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  id: string;
  timestamp: string;
  event_message: string;
  level: string;
  msg: string;
}

const AuditLogs = () => {
  const { loading } = useAdminCheck();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      // For demonstration, use mock data
      // In production, integrate with Supabase Analytics API
      setLogs([
        {
          id: "1",
          timestamp: new Date().toISOString(),
          event_message: JSON.stringify({
            action: "login",
            user_id: "user123",
            ip: "192.168.1.1"
          }),
          level: "info",
          msg: "User login successful"
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          event_message: JSON.stringify({
            action: "password_reset",
            user_id: "user456"
          }),
          level: "warn",
          msg: "Password reset requested"
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          event_message: JSON.stringify({
            action: "failed_login",
            ip: "192.168.1.5",
            attempts: 3
          }),
          level: "error",
          msg: "Failed login attempt"
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          event_message: JSON.stringify({
            action: "role_change",
            user_id: "user789",
            old_role: "customer",
            new_role: "retailer"
          }),
          level: "info",
          msg: "User role updated"
        },
        {
          id: "5",
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          event_message: JSON.stringify({
            action: "logout",
            user_id: "user123"
          }),
          level: "info",
          msg: "User logout"
        }
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warn":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  const getEventIcon = (msg: string) => {
    const msgLower = msg.toLowerCase();
    if (msgLower.includes("login")) return <LogIn className="h-4 w-4 text-green-500" />;
    if (msgLower.includes("logout")) return <LogOut className="h-4 w-4 text-gray-500" />;
    if (msgLower.includes("error") || msgLower.includes("failed")) return <ShieldAlert className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-blue-500" />;
  };

  if (loading || loadingLogs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Audit Logs</h1>
            </div>
          </header>

          <main className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Security & Activity Logs</CardTitle>
                <CardDescription>
                  Monitor authentication events and system activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {getEventIcon(log.msg)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.msg || "Activity"}
                          </TableCell>
                          <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                            {log.event_message}
                          </TableCell>
                          <TableCell>
                            {getLevelBadge(log.level)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs available
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AuditLogs;
