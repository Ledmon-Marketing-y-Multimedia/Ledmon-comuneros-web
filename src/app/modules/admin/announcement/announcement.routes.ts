import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { AnnouncementService } from 'app/modules/admin/announcement/announcement.service';
import { AnnouncementListComponent } from 'app/modules/admin/announcement/list/list.component';
import { AnnouncementComponent } from './announcement.component';
import { catchError, throwError } from 'rxjs';
import { AnnouncementDetailsComponent } from './details/details.component';
import { ComunerosService } from '../comuneros/comuneros.service';


/**
 * announcement resolver
 *
 * @param route
 * @param state
 */
export const announcementResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const announcementService = inject(AnnouncementService);
    const router = inject(Router);

    return announcementService.getAnnouncementById(route.paramMap.get('id'))
        .pipe(
            // Error here means the requested announcement is not available
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
        component: AnnouncementComponent,
        children : [
            {
                path     : '',
                component: AnnouncementListComponent,
                resolve  : {
                    announcements : () => inject(AnnouncementService).getAnnouncements(),
                },
            },
            {
                path     : 'new',
                component: AnnouncementDetailsComponent,
                resolve  : {
                    comuneros: () => inject(ComunerosService).getComuneros(),
                },
            },
            {
                path     : ':id',
                component: AnnouncementDetailsComponent,
                resolve  : {
                    announcement : announcementResolver,
                    comuneros: () => inject(ComunerosService).getComuneros(),
                },
            }
        ],
    },
] as Routes;
