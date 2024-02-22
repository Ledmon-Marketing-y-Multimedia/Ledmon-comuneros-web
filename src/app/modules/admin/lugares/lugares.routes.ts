import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { LugaresComponent } from 'app/modules/admin/lugares/lugares.component';
import { LugaresService } from 'app/modules/admin/lugares/lugares.service';
import { LugaresDetailsComponent } from 'app/modules/admin/lugares/details/details.component';
import { LugaresListComponent } from 'app/modules/admin/lugares/list/list.component';
import { catchError, throwError } from 'rxjs';

/**
 * Lugar resolver
 *
 * @param route
 * @param state
 */
const contactResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const lugaresService = inject(LugaresService);
    const router = inject(Router);

    return lugaresService.getContactById(route.paramMap.get('id'))
        .pipe(
            // Error here means the requested comunero is not available
            catchError((error) =>
            {
                // Log the error
                console.error(error);

                // Get the parent url
                const parentUrl = state.url.split('/').slice(0, -1).join('/');

                // Navigate to there
                router.navigateByUrl(parentUrl);

                // Throw an error
                return throwError(error);
            }),
        );
};

/**
 * Can deactivate lugares details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateLugaresDetails = (
    component: LugaresDetailsComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot) =>
{
    // Get the next route
    let nextRoute: ActivatedRouteSnapshot = nextState.root;
    while ( nextRoute.firstChild )
    {
        nextRoute = nextRoute.firstChild;
    }

    // If the next state doesn't contain '/lugares'
    // it means we are navigating away from the
    // lugares app
    if ( !nextState.url.includes('/lugares') )
    {
        // Let it navigate
        return true;
    }

    // If we are navigating to another comunero...
    if ( nextRoute.paramMap.get('id') )
    {
        // Just navigate
        return true;
    }

    // Otherwise, close the drawer first, and then navigate
    return component.closeDrawer().then(() => true);
};

export default [
    {
        path     : '',
        component: LugaresComponent,
        children : [
            {
                path     : '',
                component: LugaresListComponent,
                resolve  : {
                    lugares : () => inject(LugaresService).getLugares(),
                },
                children : [
                    {
                        path         : ':id',
                        component    : LugaresDetailsComponent,
                        resolve      : {
                            lugar  : contactResolver,
                        },
                        canDeactivate: [canDeactivateLugaresDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
