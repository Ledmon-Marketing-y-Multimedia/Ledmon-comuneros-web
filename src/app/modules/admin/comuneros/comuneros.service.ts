import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Comunero, Country, Tag } from 'app/modules/admin/comuneros/comuneros.types';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';

const COMUNEROS_URL = environment.apiUrl + '/comunero';

@Injectable({providedIn: 'root'})
export class ComunerosService
{
    // Private
    private _contact: BehaviorSubject<Comunero | null> = new BehaviorSubject(null);
    private _comuneros: BehaviorSubject<Comunero[] | null> = new BehaviorSubject(null);
    private _countries: BehaviorSubject<Country[] | null> = new BehaviorSubject(null);
    private _tags: BehaviorSubject<Tag[] | null> = new BehaviorSubject(null);

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
        return this._contact.asObservable();
    }

    /**
     * Getter for comuneros
     */
    get comuneros$(): Observable<Comunero[]>
    {
        return this._comuneros.asObservable();
    }

    /**
     * Getter for countries
     */
    get countries$(): Observable<Country[]>
    {
        return this._countries.asObservable();
    }

    /**
     * Getter for tags
     */
    get tags$(): Observable<Tag[]>
    {
        return this._tags.asObservable();
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
    searchComuneros(query: string): Observable<Comunero[]>
    {
        return this._httpClient.get<Comunero[]>('api/apps/contacts/search', {
            params: {query},
        }).pipe(
            tap((comuneros) =>
            {
                this._comuneros.next(comuneros);
            }),
        );
    }

    /**
     * Get comunero by id
     */
    getContactById(id: string): Observable<Comunero>
    {
        return this._comuneros.pipe(
            take(1),
            map((comuneros) =>
            {
                // Find the comunero
                const comunero = comuneros.find(item => item.id === id) || null;

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
    createContact(): Observable<Comunero>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.post<Comunero>('api/apps/contacts/contact', {}).pipe(
                map((newContact) =>
                {
                    // Update the comuneros with the new comunero
                    this._comuneros.next([newContact, ...comuneros]);

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
    updateContact(id: string, comunero: Comunero): Observable<Comunero>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.patch<Comunero>('api/apps/contacts/contact', {
                id,
                comunero,
            }).pipe(
                map((updatedContact) =>
                {
                    // Find the index of the updated comunero
                    const index = comuneros.findIndex(item => item.id === id);

                    // Update the comunero
                    comuneros[index] = updatedContact;

                    // Update the comuneros
                    this._comuneros.next(comuneros);

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
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.delete('api/apps/contacts/contact', {params: {id}}).pipe(
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
     * Get countries
     */
    getCountries(): Observable<Country[]>
    {
        return this._httpClient.get<Country[]>('api/apps/contacts/countries').pipe(
            tap((countries) =>
            {
                this._countries.next(countries);
            }),
        );
    }

    /**
     * Get tags
     */
    getTags(): Observable<Tag[]>
    {
        return this._httpClient.get<Tag[]>('api/apps/contacts/tags').pipe(
            tap((tags) =>
            {
                this._tags.next(tags);
            }),
        );
    }

    /**
     * Create tag
     *
     * @param tag
     */
    createTag(tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.post<Tag>('api/apps/contacts/tag', {tag}).pipe(
                map((newTag) =>
                {
                    // Update the tags with the new tag
                    this._tags.next([...tags, newTag]);

                    // Return new tag from observable
                    return newTag;
                }),
            )),
        );
    }

    /**
     * Update the tag
     *
     * @param id
     * @param tag
     */
    updateTag(id: string, tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.patch<Tag>('api/apps/contacts/tag', {
                id,
                tag,
            }).pipe(
                map((updatedTag) =>
                {
                    // Find the index of the updated tag
                    const index = tags.findIndex(item => item.id === id);

                    // Update the tag
                    tags[index] = updatedTag;

                    // Update the tags
                    this._tags.next(tags);

                    // Return the updated tag
                    return updatedTag;
                }),
            )),
        );
    }

    /**
     * Delete the tag
     *
     * @param id
     */
    deleteTag(id: string): Observable<boolean>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.delete('api/apps/contacts/tag', {params: {id}}).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted tag
                    const index = tags.findIndex(item => item.id === id);

                    // Delete the tag
                    tags.splice(index, 1);

                    // Update the tags
                    this._tags.next(tags);

                    // Return the deleted status
                    return isDeleted;
                }),
                filter(isDeleted => isDeleted),
                switchMap(isDeleted => this.comuneros$.pipe(
                    take(1),
                    map((comuneros) =>
                    {
                        // Iterate through the comuneros
                        // comuneros.forEach((comunero) =>
                        // {
                        //     const tagIndex = comunero.tags.findIndex(tag => tag === id);

                        //     // If the comunero has the tag, remove it
                        //     if ( tagIndex > -1 )
                        //     {
                        //         comunero.tags.splice(tagIndex, 1);
                        //     }
                        // });

                        // Return the deleted status
                        return isDeleted;
                    }),
                )),
            )),
        );
    }

    /**
     * Update the avatar of the given comunero
     *
     * @param id
     * @param avatar
     */
    uploadAvatar(id: string, avatar: File): Observable<Comunero>
    {
        return this.comuneros$.pipe(
            take(1),
            switchMap(comuneros => this._httpClient.post<Comunero>('api/apps/comuneros/avatar', {
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
                    const index = comuneros.findIndex(item => item.id === id);

                    // Update the comunero
                    comuneros[index] = updatedContact;

                    // Update the comuneros
                    this._comuneros.next(comuneros);

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
