import { auth } from "@/auth";

import {
  LogoutButton,
} from "@/components/auth/logout-button";

export default async function AdminPanelPage() {
  const session = await auth();

  return (
    <main>
      <h1>Admin Panel</h1>

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