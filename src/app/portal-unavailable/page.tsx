// The client portal is Phase 3 (hard block C-1). Client-role accounts that
// somehow exist land here instead of any app surface.
export default function PortalUnavailablePage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-sm space-y-1 text-center">
        <h1 className="text-lg font-medium">Portal not available</h1>
        <p className="text-sm text-muted-foreground">
          The client portal is not yet live. Please contact your KiBiz account
          manager.
        </p>
      </div>
    </main>
  );
}
