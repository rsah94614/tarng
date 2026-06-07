export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
          tarng
        </span>
        <p className="mt-2 text-muted-foreground">Share your world.</p>
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        {children}
      </div>
    </div>
  );
}
