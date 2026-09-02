"use client";

import { trpc } from "@/trpc/client";

export default function TRPCTestPage() {
  const health = trpc.health.check.useQuery();

  if (health.isLoading) {
    return <div>در حال اتصال به API...</div>;
  }

  if (health.isError) {
    return (
      <div>
        خطا در اتصال به tRPC:
        <pre>{health.error.message}</pre>
      </div>
    );
  }

  return (
    <main>
      <h1>tRPC Test</h1>

      <pre>{JSON.stringify(health.data, null, 2)}</pre>
    </main>
  );
}
