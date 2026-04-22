import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Solo intentamos buscar el token si estamos en el navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('anselmi_token');

    // Si hay token, clonamos la petición y le inyectamos la cabecera de Authorization
    if (token) {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(clonedReq);
    }
  }

  // Si no hay token o no es el navegador, la petición sigue su curso normal
  return next(req);
};
