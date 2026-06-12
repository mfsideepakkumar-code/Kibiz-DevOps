import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { roleLandingPath } from "@/lib/roles";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(roleLandingPath(user.role));
}
