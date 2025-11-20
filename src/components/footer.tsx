'use client';

import * as React from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear());

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background/95 backdrop-blur-sm border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
          © {currentYear} VoteSync. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
