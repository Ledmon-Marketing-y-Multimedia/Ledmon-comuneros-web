import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Comunero, Country, NewComunero, Tag } from 'app/modules/admin/comuneros/comuneros.types';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';

const COMUNEROS_URL = environment.apiUrl + '/comunero';

@Injectable({providedIn: 'root'})
export class ComunerosService
{
    // Private
    private _comunero: BehaviorSubject<Comunero | null> = new BehaviorSubject(null);
    private _comuneros: BehaviorSubject<Comunero[] | null> = new BehaviorSubject(null);

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
    get comunero$(): Observable<Comunero>
    {
        return this._comunero.asObservable();
    }

    /**
     * Getter for comuneros
     */
    get comuneros$(): Observable<Comunero[]>
    {
        return this._comuneros.asObservable();
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get comuneros
     */
    getComuneros(): Observable<Comunero[]>
    {
        return this._httpClient.get<Comunero[]>(COMUNEROS_URL + "/search/" + "marcon").pipe(
            tap((comuneros) =>
            {
                this._comuneros.next(comuneros.sort((a, b) => a.user.name.localeCompare(b.user.name)));
            }),
        );
    }

    /**
     * Search comuneros with given query
     *
     * @param query
     */
    searchComuneros(name: string): Observable<Comunero[]>
    {
        return this._httpClient.get<Comunero[]>(COMUNEROS_URL + "/search/" + "marcon", {
            params: {name},
        }).pipe(
            tap((comuneros) =>
            {
                this._comuneros.next(comuneros.sort((a, b) => a.user.name.localeCompare(b.user.name)));
            }),
        );
    }

    /**
     * Get comunero by id
     */
    getComuneroById(id: string): Observable<Comunero>
    {
        return this._comuneros.pipe(
            take(1),
            map((comuneros) =>
            {
                // Find the comunero
                const comunero = comuneros.find(item => item.id === id) || null;

                // Update the comunero
                this._comunero.next(comunero);

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
    createComunero(comunero: NewComunero): Observable<Comunero>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.post<Comunero>(COMUNEROS_URL, comunero).pipe(
                map((newComunero) =>
                {
                    // Update the comuneros with the new comunero
                    this._comuneros.next([newComunero, ...comuneros]);

                    // Return the new comunero
                    return newComunero;
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
    updateComunero(id: string, comunero: Comunero): Observable<Comunero>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.patch<Comunero>(COMUNEROS_URL + "/" + id,
                comunero).pipe(
                map((updatedComunero) =>
                {
                    // Find the index of the updated comunero
                    const index = comuneros.findIndex(item => item.id === id);

                    // Update the comunero
                    comuneros[index] = updatedComunero;

                    // Update the comuneros
                    this._comuneros.next(comuneros);

                    // Return the updated comunero
                    return updatedComunero;
                }),
                switchMap(updatedComunero => this.comunero$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() =>
                    {
                        // Update the comunero if it's selected
                        this._comunero.next(updatedComunero);

                        // Return the updated comunero
                        return updatedComunero;
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
    deleteComunero(id: string): Observable<boolean>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.delete('api/apps/comuneros/comunero', {params: {id}}).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted comunero
                    const index = comuneros.findIndex(item => item.id === id);

                    // Delete the comunero
                    comuneros.splice(index, 1);

                    // Update the comuneros
                    this._comuneros.next(comuneros);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }

    /**
     * Mock the user
     *
     */
    newComunero(): Observable<Comunero>
    {
        const newComunero : Comunero = {background: '', user : {name: '', id : '', username: '', phoneNumbers: [], email: ''}, id: ''}
        this._comunero.next(newComunero);
        return of(newComunero);
    }
}
