import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { MeetingListComponent } from 'app/modules/admin/meeting/list/list.component';
import { MeetingService } from 'app/modules/admin/meeting/meeting.service';
import { Meeting, MeetingAttendance } from 'app/modules/admin/meeting/meeting.types';
import { assign } from 'lodash-es';
import { BehaviorSubject, debounceTime, filter, Observable, Subject, take, takeUntil, tap } from 'rxjs';

@Component({
    selector       : 'meeting-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    animations     : fuseAnimations,
    imports        : [CommonModule, FormsModule, ZXingScannerModule, ReactiveFormsModule, MatButtonModule, NgIf, MatIconModule, MatMenuModule, RouterLink, MatDividerModule, MatFormFieldModule, MatInputModule, TextFieldModule, NgFor, MatRippleModule, MatCheckboxModule, NgClass, MatDatepickerModule, FuseFindByKeyPipe, DatePipe],
})
export class MeetingDetailsComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('nameField') private _nameField: ElementRef;

    meeting: Meeting;
    meetingForm: UntypedFormGroup;
    meetings: Meeting[];
    allowedFormats = [ BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC, BarcodeFormat.CODE_39,  BarcodeFormat.CODE_93,  BarcodeFormat.CODABAR,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.UPC_EAN_EXTENSION, BarcodeFormat.EAN_8, BarcodeFormat.MAXICODE, BarcodeFormat.PDF_417, BarcodeFormat.ITF, BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED, BarcodeFormat.EAN_8];

    private _meetingAttendance: BehaviorSubject<MeetingAttendance | null> = new BehaviorSubject(null);
    meetingAttendance$ : Observable<MeetingAttendance> = this._meetingAttendance.asObservable();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    hasPermission: boolean;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _meetingListComponent: MeetingListComponent,
        private _meetingService: MeetingService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
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
        // Open the drawer
        this._meetingListComponent.matDrawer.open();

        // Create the meeting form
        this.meetingForm = this._formBuilder.group({
            id       : [''],
            name    : [''],
            description : [''],
            date  : [null],
            status : [''],
        });

        // Get the meetings
        this._meetingService.meetings$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((meetings: Meeting[]) =>
            {
                this.meetings = meetings;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the meeting
        this._meetingService.meeting$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((meeting: Meeting) =>
            {

                let scanner = new ZXingScannerComponent();
                scanner.askForPermission().then((result) => {
                    alert(result);
                });
                // Open the drawer in case it is closed
                this._meetingListComponent.matDrawer.open();

                // Get the meeting
                this.meeting = meeting;

                // Patch values to the form from the meeting
                this.meetingForm.patchValue(meeting, {emitEvent: false});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Update meeting when there is a value change on the meeting form
        this.meetingForm.valueChanges
            .pipe(
                tap((value) =>
                {
                    // Update the meeting object
                    this.meeting = assign(this.meeting, value);
                }),
                debounceTime(300),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe((value) =>
            {
                // Update the meeting on the server
                this._meetingService.updateMeeting(value.id, value).subscribe();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for NavigationEnd event to focus on the title field
        this._router.events
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(event => event instanceof NavigationEnd),
            )
            .subscribe(() =>
            {
                // Focus on the title field
                this._nameField.nativeElement.focus();
            });
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Listen for matDrawer opened change
        this._meetingListComponent.matDrawer.openedChange
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(opened => opened),
            )
            .subscribe(() =>
            {
                // Focus on the title element
                this._nameField.nativeElement.focus();
            });
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
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._meetingListComponent.matDrawer.close();
    }

    /**
     * Toggle the completed status
     */
    toggleCompleted(): void
    {
        // Get the form control for 'completed'
        const completedFormControl = this.meetingForm.get('completed');

        // Toggle the completed status
        completedFormControl.setValue(!completedFormControl.value);
    }

    /**
     * Set the meeting priority
     *
     * @param priority
     */
    setMeetingPriority(priority): void
    {
        // Set the value
        this.meetingForm.get('priority').setValue(priority);
    }

    /**
     * Delete the meeting
     */
    deleteMeeting(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete meeting',
            message: 'Are you sure you want to delete this meeting? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) =>
        {
            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Get the current meeting's id
                const id = this.meeting.id;

                // Get the next/previous meeting's id
                const currentMeetingIndex = this.meetings.findIndex(item => item.id === id);
                const nextMeetingIndex = currentMeetingIndex + ((currentMeetingIndex === (this.meetings.length - 1)) ? -1 : 1);
                const nextMeetingId = (this.meetings.length === 1 && this.meetings[0].id === id) ? null : this.meetings[nextMeetingIndex].id;

                // Delete the meeting
                this._meetingService.deleteMeeting(id)
                    .subscribe((isDeleted) =>
                    {
                        // Return if the meeting wasn't deleted...
                        if ( !isDeleted )
                        {
                            return;
                        }

                        // Navigate to the next meeting if available
                        if ( nextMeetingId )
                        {
                            this._router.navigate(['../', nextMeetingId], {relativeTo: this._activatedRoute});
                        }
                        // Otherwise, navigate to the parent
                        else
                        {
                            this._router.navigate(['../'], {relativeTo: this._activatedRoute});
                        }
                    });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
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

    scanSuccessHandler(event: any) {
        console.log('Success' + event);
        const attendance : MeetingAttendance = {
            comunero: {id: event},
            meeting: {id: this.meeting.id},
            status: 'ASISTE',
            entryDate: new Date()
        }
        this._meetingAttendance.value ? null :
        this._meetingService.registerAttendance(attendance).pipe(take(1)).subscribe(
            (result) => {
                this._meetingAttendance.next(result);
                let snd = new Audio("assets/sounds/ping.mp3");
                snd.play();
                console.log('Attendance registered');
                setTimeout(() => {
                    this._meetingAttendance.next(null);
                }, 3000);
            },
            (error) => {
                console.error('Error registering attendance', error);
            }
        );
    }

    scanErrorHandler(event: any) {
    alert('Error' + event);
    }

    scanFailureHandler(event: any) {
    alert('Failure' + event);
    }

    onHasPermission(has: boolean) {
        this.hasPermission = has;
    }
}
