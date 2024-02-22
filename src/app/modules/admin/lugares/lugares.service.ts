import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Lugar } from './lugares.types';

const LUGAR_URL = environment.apiUrl + '/lugar';

@Injectable({providedIn: 'root'})
export class LugaresService
{
    // Private
    private _contact: BehaviorSubject<Lugar | null> = new BehaviorSubject(null);
    private _lugares: BehaviorSubject<Lugar[] | null> = new BehaviorSubject(null);

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
     * Getter for comunero
     */
    get comunero$(): Observable<Lugar>
    {
        return this._contact.asObservable();
    }

    /**
     * Getter for lugares
     */
    get lugares$(): Observable<Lugar[]>
    {
        return this._lugares.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get lugares
     */
    getLugares(): Observable<Lugar[]>
    {
        return this._httpClient.get<Lugar[]>(LUGAR_URL + "/search/" + "marcon").pipe(
            tap((lugares) =>
            {
                this._lugares.next(lugares.sort((a, b) => a.address.localeCompare(b.address)));
            }),
        );
    }

    /**
     * Search lugares with given query
     *
     * @param query
     */
    searchLugares(query: string): Observable<Lugar[]>
    {
        return this._httpClient.get<Lugar[]>('api/apps/contacts/search', {
            params: {query},
        }).pipe(
            tap((lugares) =>
            {
                this._lugares.next(lugares);
            }),
        );
    }

    /**
     * Get comunero by id
     */
    getContactById(id: string): Observable<Lugar>
    {
        return this._lugares.pipe(
            take(1),
            map((lugares) =>
            {
                // Find the comunero
                const comunero = lugares.find(item => item.id === id) || null;

                // Update the comunero
                this._contact.next(comunero);

                // Return the comunero
                return comunero;
            }),
            switchMap((comunero) =>
            {
                if ( !comunero )
                {
                    return throwError('Could not found comunero with id of ' + id + '!');
                }

                return of(comunero);
            }),
        );
    }

    /**
     * Create comunero
     */
    createContact(): Observable<Lugar>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.post<Lugar>('api/apps/contacts/contact', {}).pipe(
                map((newContact) =>
                {
                    // Update the lugares with the new comunero
                    this._lugares.next([newContact, ...lugares]);

                    // Return the new comunero
                    return newContact;
                }),
            )),
        );
    }

    /**
     * Update comunero
     *
     * @param id
     * @param comunero
     */
    updateContact(id: string, comunero: Lugar): Observable<Lugar>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.patch<Lugar>('api/apps/contacts/contact', {
                id,
                comunero,
            }).pipe(
                map((updatedContact) =>
                {
                    // Find the index of the updated comunero
                    const index = lugares.findIndex(item => item.id === id);

                    // Update the comunero
                    lugares[index] = updatedContact;

                    // Update the lugares
                    this._lugares.next(lugares);

                    // Return the updated comunero
                    return updatedContact;
                }),
                switchMap(updatedContact => this.comunero$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the comunero if it's selected
                        this._contact.next(updatedContact);

                        // Return the updated comunero
                        return updatedContact;
                    }),
                )),
            )),
        );
    }

    /**
     * Delete the comunero
     *
     * @param id
     */
    deleteContact(id: string): Observable<boolean>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.delete('api/apps/contacts/contact', {params: {id}}).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted comunero
                    const index = lugares.findIndex(item => item.id === id);

                    // Delete the comunero
                    lugares.splice(index, 1);

                    // Update the lugares
                    this._lugares.next(lugares);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }


    /**
     * Update the avatar of the given comunero
     *
     * @param id
     * @param avatar
     */
    uploadAvatar(id: string, avatar: File): Observable<Lugar>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.post<Lugar>('api/apps/lugares/avatar', {
                id,
                avatar,
            }, {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'Content-Type': avatar.type,
                },
            }).pipe(
                map((updatedContact) =>
                {
                    // Find the index of the updated comunero
                    const index = lugares.findIndex(item => item.id === id);

                    // Update the comunero
                    lugares[index] = updatedContact;

                    // Update the lugares
                    this._lugares.next(lugares);

                    // Return the updated comunero
                    return updatedContact;
                }),
                switchMap(updatedContact => this.comunero$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the comunero if it's selected
                        this._contact.next(updatedContact);

                        // Return the updated comunero
                        return updatedContact;
                    }),
                )),
            )),
        );
    }
}
