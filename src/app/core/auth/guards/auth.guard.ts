import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Check the authentication status
    return inject(AuthService).check().pipe(
        switchMap((authenticated) =>
        {
            // If the user is not authenticated...
            if ( !authenticated )
            {
                // Redirect to the sign-in page with a redirectUrl param
                authService.signOut().subscribe(() => {
                    const urlTree = router.parseUrl(`sign-in?redirectURL=${state.url}`);
                    return of(urlTree);
                });

            }

            // Allow the access
            return of(true);
        }),
    );
};
