import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Only check authentication in browser
  if (isPlatformBrowser(platformId)) {
    if (!authService.isAuthenticated()) {
      // Not authenticated, allow access to auth page
      return true;
    }

    // Already authenticated, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  // During SSR, allow navigation (will be checked on client side)
  return true;
};

