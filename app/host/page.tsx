import { auth } from "@/auth";

import {
  LogoutButton,
} from "@/components/auth/logout-button";

export default async function HostPage() {
  const session = await auth();

  return (
    <main>
      <h1>Host Dashboard</h1>

      <pre>
        {JSON.stringify(
          session,
          null,
          2,
        )}
      </pre>

      <LogoutButton />
    </main>
  );
}