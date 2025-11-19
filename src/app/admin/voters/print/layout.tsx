// This is a special layout that will only be applied to the print page.
// It ensures that no other UI components from the main admin layout
// interfere with the print styles.

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
