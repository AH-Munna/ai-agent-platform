import { redirect } from "next/navigation";
import { auth } from "~/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any; 

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">Welcome, {user.username || user.name || "User"}</h2>
        <p className="text-muted-foreground">Select a chat from the sidebar or start a new one.</p>
    </div>
  );
}
