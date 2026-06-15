import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getActiveTimer } from "@/lib/timer-queries";

import { Sidebar } from "./_shell/sidebar";
import { TimerWidget } from "./_timer/timer-widget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const activeTimer = await getActiveTimer();

  return (
    <div className="flex min-h-svh">
      <Sidebar role={user.role} name={user.name} email={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-6">
          <TimerWidget timer={activeTimer} />
        </header>
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
