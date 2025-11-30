import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'editor',
    loadComponent: () => import('./editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },
  {
    path: 'marketplace',
    loadComponent: () => import('./marketplace/marketplace').then(m => m.Marketplace),
    canActivate: [authGuard]
  },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth').then(m => m.Auth),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
