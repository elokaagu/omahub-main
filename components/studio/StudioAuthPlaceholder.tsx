/** Minimal placeholder while studio auth/permissions resolve — no spinner. */
export function StudioAuthPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white px-6">
      <p className="text-sm text-gray-500">Loading studio…</p>
    </div>
  );
}
