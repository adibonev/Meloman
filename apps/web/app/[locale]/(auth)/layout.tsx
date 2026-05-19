import { OauthButtons } from "@/components/oauth-buttons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      {children}
      {/* Renders nothing until OAuth env keys are set (see OauthButtons). */}
      <OauthButtons />
    </main>
  );
}
