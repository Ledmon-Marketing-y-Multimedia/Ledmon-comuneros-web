import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Announcement } from './announcement.types';

const LUGAR_URL = environment.apiUrl + '/lugar';

@Injectable({providedIn: 'root'})
export class AnnouncementService
{
    // Private
    private _lugar: BehaviorSubject<Announcement | null> = new BehaviorSubject(null);
    private _announcement: BehaviorSubject<Announcement[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for lugar
     */
    get lugar$(): Observable<Announcement>
    {
        return this._lugar.asObservable();
    }

    /**
     * Getter for announcement
     */
    get announcement$(): Observable<Announcement[]>
    {
        return this._announcement.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get announcement
     */
    getAnnouncement(): Observable<Announcement[]>
    {
        return this._httpClient.get<Announcement[]>(LUGAR_URL + "/search/" + "marcon").pipe(
            tap((announcement) =>
            {
                this._announcement.next(announcement.sort((a, b) => (a.address || "").localeCompare(b.address || "")));
            }),
        );
    }

    /**
     * Search announcement with given query
     *
     * @param query
     */
    searchAnnouncement(address: string): Observable<Announcement[]>
    {
        return this._httpClient.get<Announcement[]>(LUGAR_URL + "/search/" + "marcon", {
            params: {address},
        }).pipe(
            tap((announcement) =>
            {
                this._announcement.next(announcement);
            }),
        );
    }

    /**
     * Get lugar by id
     */
    getAnnouncementById(id: string): Observable<Announcement>
    {
        return this._announcement.pipe(
            take(1),
            map((announcement) =>
            {
                // Find the lugar
                const lugar = announcement.find(item => item.id === id) || null;

                // Update the lugar
                this._lugar.next(lugar);

                // Return the lugar
                return lugar;
            }),
            switchMap((lugar) =>
            {
                if ( !lugar )
                {
                    return throwError('Could not found lugar with id of ' + id + '!');
                }

                return of(lugar);
            }),
        );
    }

    /**
     * Create lugar
     */
    createAnnouncement(): Observable<Announcement>
    {
        return this.announcement$.pipe(
            take(1),
            switchMap(announcement => this._httpClient.post<Announcement>(LUGAR_URL, {comunidadId: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}).pipe(
                map((newAnnouncement) =>
                {
                    // Update the announcement with the new lugar
                    this._announcement.next([newAnnouncement, ...announcement]);

                    // Return the new lugar
                    return newAnnouncement;
                }),
            )),
        );
    }

    /**
     * Update lugar
     *
     * @param id
     * @param lugar
     */
    updateAnnouncement(id: string, lugar: Announcement): Observable<Announcement>
    {
        return this.announcement$.pipe(
            take(1),
            switchMap(announcement => this._httpClient.patch<Announcement>(LUGAR_URL + "/" + id,
                lugar,
            ).pipe(
                map((updatedAnnouncement) =>
                {
                    // Find the index of the updated lugar
                    const index = announcement.findIndex(item => item.id === id);

                    // Update the lugar
                    announcement[index] = updatedAnnouncement;

                    // Update the announcement
                    this._announcement.next(announcement);

                    // Return the updated lugar
                    return updatedAnnouncement;
                }),
                switchMap(updatedAnnouncement => this.lugar$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the lugar if it's selected
                        this._lugar.next(updatedAnnouncement);

                        // Return the updated lugar
                        return updatedAnnouncement;
                    }),
                )),
            )),
        );
    }

    /**
     * Delete the lugar
     *
     * @param id
     */
    deleteAnnouncement(id: string): Observable<boolean>
    {
        return this.announcement$.pipe(
            take(1),
            switchMap(announcement => this._httpClient.delete(LUGAR_URL + "/" + id).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted lugar
                    const index = announcement.findIndex(item => item.id === id);

                    // Delete the lugar
                    announcement.splice(index, 1);

                    // Update the announcement
                    this._announcement.next(announcement);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }


    /**
     * Update the avatar of the given lugar
     *
     * @param id
     * @param avatar
     */
    uploadAvatar(id: string, avatar: File): Observable<Announcement>
    {
        return this.announcement$.pipe(
            take(1),
            switchMap(announcement => this._httpClient.post<Announcement>('api/apps/announcement/avatar', {
                id,
                avatar,
            }, {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'Content-Type': avatar.type,
                },
            }).pipe(
                map((updatedAnnouncement) =>
                {
                    // Find the index of the updated lugar
                    const index = announcement.findIndex(item => item.id === id);

                    // Update the lugar
                    announcement[index] = updatedAnnouncement;

                    // Update the announcement
                    this._announcement.next(announcement);

                    // Return the updated lugar
                    return updatedAnnouncement;
                }),
                switchMap(updatedAnnouncement => this.lugar$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the lugar if it's selected
                        this._lugar.next(updatedAnnouncement);

                        // Return the updated lugar
                        return updatedAnnouncement;
                    }),
                )),
            )),
        );
    }
}
