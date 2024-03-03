import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { ComunerosComponent } from 'app/modules/admin/comuneros/comuneros.component';
import { ComunerosService } from 'app/modules/admin/comuneros/comuneros.service';
import { ComunerosDetailsComponent } from 'app/modules/admin/comuneros/details/details.component';
import { ComunerosListComponent } from 'app/modules/admin/comuneros/list/list.component';
import { catchError, throwError } from 'rxjs';
import { LugaresService } from '../lugares/lugares.service';

/**
 * Comunero resolver
 *
 * @param route
 * @param state
 */
export const comuneroResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const comunerosService = inject(ComunerosService);
    const router = inject(Router);

    return comunerosService.getComuneroById(route.paramMap.get('id'))
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
 * New Comunero resolver
 *
 * @param route
 * @param state
 */
const newComuneroResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const comunerosService = inject(ComunerosService);
    return comunerosService.newComunero();
};

/**
 * Can deactivate comuneros details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateComunerosDetails = (
    component: ComunerosDetailsComponent,
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

    // If the next state doesn't contain '/comuneros'
    // it means we are navigating away from the
    // comuneros app
    if ( !nextState.url.includes('/comuneros') )
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
        component: ComunerosComponent,
        children : [
            {
                path     : '',
                component: ComunerosListComponent,
                resolve  : {
                    comuneros : () => inject(ComunerosService).getComuneros(),
                },
                children : [
                    {
                        path         : 'new',
                        component    : ComunerosDetailsComponent,
                        resolve      : {
                            comunero  : newComuneroResolver,
                            lugares   : () => inject(LugaresService).getLugares()
                        },
                        canDeactivate: [canDeactivateComunerosDetails],
                    },
                    {
                        path         : ':id',
                        component    : ComunerosDetailsComponent,
                        resolve      : {
                            comunero  : comuneroResolver,
                            lugares   : () => inject(LugaresService).getLugares()
                        },
                        canDeactivate: [canDeactivateComunerosDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
