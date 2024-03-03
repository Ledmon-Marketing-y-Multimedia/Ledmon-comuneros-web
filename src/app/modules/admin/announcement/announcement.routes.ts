import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { AnnouncementComponent } from 'app/modules/admin/announcement/announcement.component';
import { AnnouncementService } from 'app/modules/admin/announcement/announcement.service';
import { AnnouncementDetailsComponent } from 'app/modules/admin/announcement/details/details.component';
import { AnnouncementListComponent } from 'app/modules/admin/announcement/list/list.component';
import { catchError, throwError } from 'rxjs';
import { ComunerosService } from '../comuneros/comuneros.service';

/**
 * Announcement resolver
 *
 * @param route
 * @param state
 */
export const lugarResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const announcementService = inject(AnnouncementService);
    const router = inject(Router);

    return announcementService.getAnnouncementById(route.paramMap.get('id'))
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
 * Can deactivate announcement details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateAnnouncementDetails = (
    component: AnnouncementDetailsComponent,
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

    // If the next state doesn't contain '/announcement'
    // it means we are navigating away from the
    // announcement app
    if ( !nextState.url.includes('/announcement') )
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
        component: AnnouncementComponent,
        children : [
            {
                path     : '',
                component: AnnouncementListComponent,
                resolve  : {
                    announcement : () => inject(AnnouncementService).getAnnouncement(),
                },
                children : [
                    {
                        path         : ':id',
                        component    : AnnouncementDetailsComponent,
                        resolve      : {
                            lugar  : lugarResolver,
                            comuneros: () => inject(ComunerosService).getComuneros(),
                        },
                        canDeactivate: [canDeactivateAnnouncementDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
