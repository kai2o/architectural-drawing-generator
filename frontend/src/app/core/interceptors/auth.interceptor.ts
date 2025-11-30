import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token from localStorage (only in browser)
  let token: string | null = null;
  
  if (typeof window !== 'undefined' && window.localStorage) {
    token = window.localStorage.getItem('auth_token');
  }
  
  if (token) {
    // Clone the request and add the authorization header
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};

