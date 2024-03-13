import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, DOCUMENT, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MeetingService } from 'app/modules/admin/meeting/meeting.service';
import { Meeting } from 'app/modules/admin/meeting/meeting.types';
import { Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector       : 'meeting-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    styles         : [
        /* language=SCSS */
        `
            .meeting-grid {
                grid-template-columns: 200px 200px 100px auto;

                @screen sm {
                    grid-template-columns: 200px 200px 100px auto;
                }

                @screen md {
                    grid-template-columns: 180px 250px 100px auto;
                }

                @screen lg {
                    grid-template-columns: 300px 250px 100px auto;
                }
            }
        `
    ],
    imports        : [MatSidenavModule, MatSortModule, MatPaginatorModule, RouterOutlet, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, NgIf, MatButtonModule, MatTooltipModule, MatIconModule, CdkDropList, NgFor, CdkDrag, NgClass, CdkDragPreview, CdkDragHandle, RouterLink, TitleCasePipe, DatePipe],
})
export class MeetingListComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    meetings: Meeting[];
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    meetingCount: any = {
        completed : 0,
        incomplete: 0,
        total     : 0,
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _meetingService: MeetingService,
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
        // Get the meeting
        this._meetingService.meetings$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((meetings: Meeting[]) =>
            {
                this.meetings = meetings;

                // Update the counts
                this.meetingCount.total = this.meetings.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query =>

                    // Search
                    this._meetingService.searchMeeting(query),
                ),
            )
        .subscribe();
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
     * Create meeting
     *
     * @param type
     */
    createMeeting(): void
    {
        // Go to the new meeting
        this._router.navigate(['new'], {relativeTo: this._activatedRoute});
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
