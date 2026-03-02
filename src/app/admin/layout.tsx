import { Toaster } from "sonner";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          duration: 4000,
          style: { fontFamily: "var(--font-inter), sans-serif" },
        }}
      />
    </>
  );
}
