import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const currentUser = userService.getCurrentUser();

  if (currentUser?.roles?.includes(3)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

