import { auth } from "@/auth";

import { LogoutButton } from "@/components/auth/logout-button";

export default async function AuthStatusPage() {
  const session = await auth();

  return (
    <main>
      <h1>Auth Status</h1>

      <pre>{JSON.stringify(session, null, 2)}</pre>

      {session?.user && <LogoutButton />}
    </main>
  );
}
