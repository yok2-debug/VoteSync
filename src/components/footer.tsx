'use client';

import * as React from 'react';

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background/95 backdrop-blur-sm border-t">
      <div className="container flex flex-col items-center justify-center gap-2 md:h-24 md:flex-row">
        <div className="text-balance text-center text-sm leading-loose text-muted-foreground">
          <p>
            © 2024 VoteSync. All rights reserved. · Created by Waluyo
          </p>
        </div>
      </div>
    </footer>
  );
}
