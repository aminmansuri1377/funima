import Link from "next/link";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorHomePage } from "@/components/visitor";

export default async function HomePage() {
  const session = await auth();

  /*
   * هنوز وارد نشده:
   * فعلاً یک entry ساده نگه می‌داریم.
   * بعداً اگر خواستیم Landing عمومی جدا طراحی می‌کنیم.
   */
  if (!session?.user?.id || !session.user.activeRole) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#f7f7f7]
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-[30px]
            bg-white
            p-8
            text-center
            shadow-[0_10px_40px_rgba(0,0,0,0.05)]
          "
        >
          <h1 className="text-3xl font-bold">فونیما</h1>

          <p
            className="
              mt-3
              leading-7
              text-(--color-text-secondary)
            "
          >
            مکان‌ها و تجربه‌های جذاب اطرافت را پیدا کن.
          </p>

          <Link
            href="/auth"
            className="
              mt-7
              inline-flex
              min-h-12
              items-center
              justify-center
              rounded-full
              bg-(--color-brand-500)
              px-7
              font-semibold
              text-white
            "
          >
            ورود / ثبت نام
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Root فقط Home نقش Visitor است.
   */
  if (session.user.activeRole === "HOST") {
    redirect("/host");
  }

  if (session.user.activeRole === "ADMIN") {
    redirect("/panel");
  }

  return <VisitorHomePage />;
}
