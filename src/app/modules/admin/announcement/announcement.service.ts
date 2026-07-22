import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Announcement } from './announcement.types';

const ANNOUNCEMENT_URL = environment.apiUrl + '/announcement';

@Injectable({providedIn: 'root'})
export class AnnouncementService
{
    // Private
    private _announcement: BehaviorSubject<Announcement | null> = new BehaviorSubject(null);
    private _announcements: BehaviorSubject<Announcement[] | null> = new BehaviorSubject(null);

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
     * Getter for announcement
     */
    get announcement$(): Observable<Announcement>
    {
        return this._announcement.asObservable();
    }

    /**
     * Getter for announcement
     */
    get announcements$(): Observable<Announcement[]>
    {
        return this._announcements.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get announcement
     */
    getAnnouncements(): Observable<Announcement[]>
    {
        return this._httpClient.get<Announcement[]>(ANNOUNCEMENT_URL + "/search/" + "marcon").pipe(
            tap((announcements) =>
            {
                this._announcements.next(announcements.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())));
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
        return this._httpClient.get<Announcement[]>(ANNOUNCEMENT_URL + "/search/" + "marcon", {
            params: {address},
        }).pipe(
            tap((announcements) =>
            {
                this._announcements.next(announcements);
            }),
        );
    }

    /**
     * Get announcement by id
     */
    getAnnouncementById(id: string): Observable<Announcement>
    {
        return this._httpClient.get<Announcement>(ANNOUNCEMENT_URL + "/" + id).pipe(
            tap((announcement) =>
            {
                this._announcement.next(announcement);
            }),
        );
    }

    /**
     * Create announcement
     */
    createAnnouncement(announcement: Announcement): Observable<Announcement>
    {
        return this._httpClient.post<Announcement>(ANNOUNCEMENT_URL, announcement)
    }

    /**
     * Send announcement email
     */
    sendEmail(announcement: Announcement): Observable<Announcement>
    {
        return this._httpClient.post<Announcement>(ANNOUNCEMENT_URL + "/email", announcement)
    }

    /**
     * Update announcement
     *
     * @param id
     * @param announcement
     */
    updateAnnouncement(id: string, announcement: Announcement): Observable<Announcement>
    {
        return this._httpClient.patch<Announcement>(ANNOUNCEMENT_URL + "/" + id,
            announcement,
            ).pipe(
                switchMap(updatedAnnouncement => this.announcement$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the announcement if it's selected
                        this._announcement.next(updatedAnnouncement);

                        // Return the updated announcement
                        return updatedAnnouncement;
                    }),
                )),
            );
    }

    /**
     * Delete the announcement
     *
     * @param id
     */
    deleteAnnouncement(id: string): Observable<boolean>
    {
        return this.announcements$.pipe(
            take(1),
            switchMap(announcements => this._httpClient.delete(ANNOUNCEMENT_URL + "/" + id).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted announcement
                    const index = announcements.findIndex(item => item.id === id);

                    // Delete the announcement
                    announcements.splice(index, 1);

                    // Update the announcement
                    this._announcements.next(announcements);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }
}
