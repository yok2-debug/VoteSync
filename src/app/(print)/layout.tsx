// This is a special layout that will only be applied to the print route group.
// It ensures that no other UI components from the main app layout
// interfere with the print styles. It is intentionally minimal.

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
