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
            },
            {
                path         : 'new',
                component    : MeetingDetailsComponent,
            },
            {
                path         : ':id',
                component    : MeetingDetailsComponent,
                resolve      : {
                    meeting: meetingResolver,
                }
            },
        ],
    },
] as Routes;
