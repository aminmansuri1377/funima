import "dotenv/config";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

const PHONE = "09120000003";

const CODE = "12345";

function getSetCookies(headers: Headers): string[] {
  const headersWithCookies = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithCookies.getSetCookie === "function") {
    return headersWithCookies.getSetCookie();
  }

  const single = headers.get("set-cookie");

  return single ? [single] : [];
}

function cookiesToMap(setCookies: string[]) {
  const cookies = new Map<string, string>();

  for (const cookie of setCookies) {
    const firstPart = cookie.split(";")[0];

    if (!firstPart) {
      continue;
    }

    const separator = firstPart.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name = firstPart.slice(0, separator);

    const value = firstPart.slice(separator + 1);

    cookies.set(name, value);
  }

  return cookies;
}

function mergeCookies(...cookieMaps: Map<string, string>[]) {
  const merged = new Map<string, string>();

  for (const map of cookieMaps) {
    for (const [name, value] of map) {
      merged.set(name, value);
    }
  }

  return merged;
}

function serializeCookies(cookies: Map<string, string>) {
  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function main() {
  console.log("\nFUNIMA NEXTAUTH TEST\n");

  /*
   * 1) Create a test OTP
   */
  const otpResponse = await fetch(`${BASE_URL}/api/dev/create-test-otp`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      phoneNumber: PHONE,
    }),
  });

  if (!otpResponse.ok) {
    const text = await otpResponse.text();

    console.log("OTP response:", text);

    throw new Error(`OTP setup failed: ${otpResponse.status}`);
  }

  const otpData = await otpResponse.json();

  console.log("✓ Development OTP created");

  console.log("OTP data:", otpData);

  /*
   * 2) Get CSRF token
   */
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);

  if (!csrfResponse.ok) {
    const text = await csrfResponse.text();

    console.log("CSRF response:", text);

    throw new Error(`CSRF request failed: ${csrfResponse.status}`);
  }

  const csrfData = (await csrfResponse.json()) as {
    csrfToken?: string;
  };

  const csrfCookies = cookiesToMap(getSetCookies(csrfResponse.headers));

  if (!csrfData.csrfToken) {
    throw new Error("Could not get CSRF token");
  }

  if (csrfCookies.size === 0) {
    throw new Error("CSRF cookie was not created");
  }

  console.log("✓ CSRF token received");

  /*
   * 3) Login through real
   * NextAuth Credentials provider
   */
  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,

    phoneNumber: PHONE,

    code: CODE,

    role: "VISITOR",

    fullName: "NextAuth Test User",

    callbackUrl: BASE_URL,
  });

  const loginResponse = await fetch(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",

        cookie: serializeCookies(csrfCookies),
      },

      body,

      redirect: "manual",
    },
  );

  console.log("Login status:", loginResponse.status);

  console.log("Login location:", loginResponse.headers.get("location"));

  const loginCookies = cookiesToMap(getSetCookies(loginResponse.headers));

  console.log("Login cookies:", Array.from(loginCookies.keys()));

  if (loginCookies.size === 0) {
    const text = await loginResponse.text();

    console.log("Login response:", text);

    throw new Error("NextAuth did not create a session cookie");
  }

  console.log("✓ Credentials login accepted");

  /*
   * Merge CSRF + session cookies
   */
  const sessionCookies = mergeCookies(csrfCookies, loginCookies);

  /*
   * 4) Read the session
   */
  const sessionResponse = await fetch(`${BASE_URL}/api/auth/session-test`, {
    headers: {
      cookie: serializeCookies(sessionCookies),
    },
  });

  if (!sessionResponse.ok) {
    const responseText = await sessionResponse.text();

    console.log("Session response:", responseText);

    throw new Error(`Session read failed: ${sessionResponse.status}`);
  }

  const session = await sessionResponse.json();

  console.log("Session:", session);

  /*
   * 5) Validate activeRole
   */
  if (session.user?.activeRole !== "VISITOR") {
    throw new Error(
      `activeRole is invalid. Received: ${session.user?.activeRole}`,
    );
  }

  console.log("✓ activeRole = VISITOR");

  /*
   * 6) Validate role membership
   */
  if (
    !Array.isArray(session.user?.roles) ||
    !session.user.roles.includes("VISITOR")
  ) {
    throw new Error("VISITOR role is missing from session");
  }

  console.log("✓ VISITOR role exists in session");

  /*
   * 7) Validate session user id
   */
  if (!session.user?.id) {
    throw new Error("User id is missing from session");
  }

  console.log("✓ User id exists in session");

  /*
   * 8) Validate phone number
   */
  if (session.user?.phoneNumber !== PHONE) {
    throw new Error(
      `Phone number mismatch. Received: ${session.user?.phoneNumber}`,
    );
  }

  console.log("✓ Phone number exists in session");

  console.log("\n✓ NEXTAUTH FLOW PASSED\n");
}

main().catch((error) => {
  console.error("\nNEXTAUTH TEST FAILED\n");

  console.error(error);

  process.exit(1);
});
