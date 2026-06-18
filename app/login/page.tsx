import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F8FF] px-4 py-8">
      <LoginForm />
    </div>
  );
}
