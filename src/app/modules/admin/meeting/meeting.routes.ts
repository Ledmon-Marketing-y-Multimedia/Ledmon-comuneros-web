import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { MeetingDetailsComponent } from 'app/modules/admin/meeting/details/details.component';
import { MeetingListComponent } from 'app/modules/admin/meeting/list/list.component';
import { MeetingComponent } from 'app/modules/admin/meeting/meeting.component';
import { MeetingService } from 'app/modules/admin/meeting/meeting.service';
import { catchError, throwError } from 'rxjs';
import { comuneroResolver } from '../comuneros/comuneros.routes';
import { ComunerosService } from '../comuneros/comuneros.service';

/**
 * Meeting resolver
 *
 * @param route
 * @param state
 */
const meetingResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const meetingService = inject(MeetingService);
    const router = inject(Router);

    return meetingService.getMeetingById(route.paramMap.get('id'))
        .pipe(
            // Error here means the requested meeting is not available
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
 * Can deactivate meeting details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateMeetingDetails = (
    component: MeetingDetailsComponent,
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

    // If the next state doesn't contain '/meeting'
    // it means we are navigating away from the
    // meeting app
    if ( !nextState.url.includes('/reuniones') )
    {
        // Let it navigate
        return true;
    }

    // If we are navigating to another meeting...
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
        component: MeetingComponent,
        children : [
            {
                path     : '',
                component: MeetingListComponent,
                resolve  : {
                    meetings: () => inject(MeetingService).getMeetings(),
                    comuneros: () => inject(ComunerosService).getComuneros()
                },
                children : [
                    {
                        path         : ':id',
                        component    : MeetingDetailsComponent,
                        resolve      : {
                            meeting: meetingResolver,
                        },
                        canDeactivate: [canDeactivateMeetingDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
