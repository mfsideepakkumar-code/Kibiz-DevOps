import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { roleLandingPath } from "@/lib/roles";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleLandingPath(user.role));

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
