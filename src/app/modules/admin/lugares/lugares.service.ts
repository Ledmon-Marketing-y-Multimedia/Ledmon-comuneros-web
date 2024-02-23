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
    private _lugar: BehaviorSubject<Lugar | null> = new BehaviorSubject(null);
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
     * Getter for lugar
     */
    get lugar$(): Observable<Lugar>
    {
        return this._lugar.asObservable();
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
                this._lugares.next(lugares.sort((a, b) => (a.address || "").localeCompare(b.address || "")));
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
     * Get lugar by id
     */
    getLugarById(id: string): Observable<Lugar>
    {
        return this._lugares.pipe(
            take(1),
            map((lugares) =>
            {
                // Find the lugar
                const lugar = lugares.find(item => item.id === id) || null;

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
    createLugar(): Observable<Lugar>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.post<Lugar>(LUGAR_URL, {comunidadId: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}).pipe(
                map((newLugar) =>
                {
                    // Update the lugares with the new lugar
                    this._lugares.next([newLugar, ...lugares]);

                    // Return the new lugar
                    return newLugar;
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
    updateLugar(id: string, lugar: Lugar): Observable<Lugar>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.patch<Lugar>(LUGAR_URL + "/" + id,
                lugar,
            ).pipe(
                map((updatedLugar) =>
                {
                    // Find the index of the updated lugar
                    const index = lugares.findIndex(item => item.id === id);

                    // Update the lugar
                    lugares[index] = updatedLugar;

                    // Update the lugares
                    this._lugares.next(lugares);

                    // Return the updated lugar
                    return updatedLugar;
                }),
                switchMap(updatedLugar => this.lugar$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the lugar if it's selected
                        this._lugar.next(updatedLugar);

                        // Return the updated lugar
                        return updatedLugar;
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
    deleteLugar(id: string): Observable<boolean>
    {
        return this.lugares$.pipe(
            take(1),
            switchMap(lugares => this._httpClient.delete(LUGAR_URL + "/" + id).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted lugar
                    const index = lugares.findIndex(item => item.id === id);

                    // Delete the lugar
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
     * Update the avatar of the given lugar
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
                map((updatedLugar) =>
                {
                    // Find the index of the updated lugar
                    const index = lugares.findIndex(item => item.id === id);

                    // Update the lugar
                    lugares[index] = updatedLugar;

                    // Update the lugares
                    this._lugares.next(lugares);

                    // Return the updated lugar
                    return updatedLugar;
                }),
                switchMap(updatedLugar => this.lugar$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the lugar if it's selected
                        this._lugar.next(updatedLugar);

                        // Return the updated lugar
                        return updatedLugar;
                    }),
                )),
            )),
        );
    }
}
