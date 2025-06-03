import { AsyncPipe, DOCUMENT, DatePipe, I18nPluralPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';
import { AnnouncementService } from 'app/modules/admin/announcement/announcement.service';
import { Announcement } from 'app/modules/admin/announcement/announcement.types';
import { Observable, Subject, map, merge, switchMap, takeUntil } from 'rxjs';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
    selector       : 'announcement-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    styles         : [
        /* language=SCSS */
        `
            .announcement-grid {
                grid-template-columns: 200px 200px auto;

                @screen sm {
                    grid-template-columns: 200px 200px auto;
                }

                @screen md {
                    grid-template-columns: 180px 250px auto;
                }

                @screen lg {
                    grid-template-columns: 300px 250px auto;
                }
            }
        `
    ],
    imports        : [MatPaginatorModule, DatePipe, MatSortModule, TranslocoLocaleModule, MatSidenavModule, RouterOutlet, NgIf, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, NgFor, NgClass, RouterLink, AsyncPipe, I18nPluralPipe],
})
export class AnnouncementListComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    announcements$: Observable<Announcement[]>;
    announcementCount: number = 0;
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedAnnouncement: Announcement;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    announcements: Announcement[];

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _announcementService: AnnouncementService,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the announcements
        this.announcements$ = this._announcementService.announcements$;
        this._announcementService.announcements$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((announcements: Announcement[]) =>
            {
                this.announcements = announcements.slice(0, 5);

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query =>
                    // Search
                    this._announcementService.searchAnnouncement(query),
                ),
            )
        .subscribe();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        if ( this._paginator )
        {

            // Mark for check
            this._changeDetectorRef.markForCheck();

            this._paginator.length = this.announcements.length;
            this._paginator.pageSize = 5;

            // Get categories if sort or page changes
            this._paginator.page.pipe(
                switchMap(() => {
                    return this._announcementService.announcements$;
                }),
                map((announcements: Announcement[]) => {
                    this._paginator.length = announcements.length;
                    this.announcements = announcements.slice(
                        this._paginator.pageIndex * this._paginator.pageSize,
                        this._paginator.pageIndex * this._paginator.pageSize + this._paginator.pageSize
                    );
                })
            ).subscribe();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
