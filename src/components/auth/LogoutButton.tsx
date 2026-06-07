import { signOut } from "@/server/auth/config";

export function LogoutButton() {
  async function action() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-md border border-border/80 bg-card/40 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground"
      >
        Log out
      </button>
    </form>
  );
}
