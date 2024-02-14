import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { combineLatest, Observable, of, ReplaySubject, take, tap } from 'rxjs';
import { adminNavigation } from './navigation';

@Injectable({providedIn: 'root'})
export class NavigationService
{
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation>
    {
        const navigation = {
            compact   : adminNavigation,
            default   : adminNavigation,
            futuristic: adminNavigation,
            horizontal: adminNavigation
        };
        this._navigation.next(navigation);
        return of(navigation);
        // combineLatest([
        //     this._userService.user$,
        //     this._companyService.company$
        // ]).pipe(take(2)).subscribe(
        //     (data) => {
        //         const user : User = data[0];
        //         const company: Company = data[1];
        //         if(user && company){
        //             const role = user.companies.find( x => x.company.id == company.id).role
        //             const navigationItem = role == UserRole.USER ? companyUserNavigation : companyAdminNavigation;
        //             const navigation = {
        //                 compact   : navigationItem,
        //                 default   : navigationItem,
        //                 futuristic: navigationItem,
        //                 horizontal: navigationItem
        //             };
        //             this._navigation.next(navigation);
        //         }
        //     }
        // );

        // return of(true);
    }
}
