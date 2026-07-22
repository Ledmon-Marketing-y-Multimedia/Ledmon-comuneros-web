import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MeetingService } from 'app/modules/admin/meeting/meeting.service';
import { Meeting, MeetingAttendance } from 'app/modules/admin/meeting/meeting.types';
import { Subject, takeUntil } from 'rxjs';
import { ComunerosService } from '../../comuneros/comuneros.service';
import { Comunero, ComuneroRole, LugarStatus } from '../../comuneros/comuneros.types';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AnnouncementService } from '../../announcement/announcement.service';
import { Announcement } from '../../announcement/announcement.types';
import { FileService } from 'app/shared/services/file.service';
import { UploadDocumentComponent } from '../upload-document/upload-document.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector       : 'meeting-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [FormsModule, MatPaginatorModule, TranslocoModule, MatSortModule, MatTableModule, ReactiveFormsModule, MatButtonModule, NgIf, MatIconModule, MatMenuModule, RouterLink, MatDividerModule, MatFormFieldModule, MatInputModule, TextFieldModule, NgFor, MatRippleModule, MatCheckboxModule, NgClass, MatDatepickerModule, FuseFindByKeyPipe, DatePipe],
})
export class MeetingDetailsComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    meeting: Meeting;
    meetingForm: UntypedFormGroup;
    meetings: Meeting[];
    comuneros: Comunero[];
    selectedFilter: string = 'all';
    editMode: boolean = false;
    attendanceDataSource : MatTableDataSource<any> = new MatTableDataSource();
    attendanceTableColumns: string[] = ['name', 'status', 'date'];
    presentCount: number;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _meetingService: MeetingService,
        private _comunerosService: ComunerosService,
        private _announcementService: AnnouncementService,
        private _fileService: FileService,
        private _matDialog: MatDialog,
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

        // Create the meeting form
        this.meetingForm = this._formBuilder.group({
            id       : [''],
            name    : ['', [Validators.required]],
            description : [''],
            date  : [null, [Validators.required]],
            status : [''],
        });

        this._comunerosService.comuneros$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comuneros: Comunero[]) =>
            {
                this.comuneros = comuneros;

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

        // Get the meeting
        this._meetingService.meeting$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((meeting: Meeting) =>
            {
                // Get the meeting
                this.meeting = meeting;
                this.editMode = meeting.id !== undefined;
                this.attendanceDataSource.data = meeting.attendance;
                this.presentCount = meeting.attendance.filter((a) => a.status === 'PRESENT').length;
                this.meetingForm.patchValue(meeting, {emitEvent: false});

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });
    }

    ngAfterViewInit(): void {
        this.attendanceDataSource.filterPredicate =
            (data: MeetingAttendance, filter: string) => data.comunero.user.name.toLowerCase().indexOf(filter) != -1;
        this.attendanceDataSource.sortData = (data: MeetingAttendance[], sort: MatSort) => {
            if (!sort.active || sort.direction === '') {
              return data;
            }
            return data.sort((a, b) => {
              const isAsc = sort.direction === 'asc';
              switch (sort.active) {
                case 'name': return this.compare(a.comunero.user.name, b.comunero.user.name, isAsc);
                case 'status': return this.compare(a.status, b.status, isAsc);
                case 'date': return this.compare(a.entryDate, b.entryDate, isAsc);
                default: return 0;
              }
            });
        }
        this.attendanceDataSource.paginator = this.paginator;
        this.attendanceDataSource.sort = this.sort;
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
     * Update the meeting
     */
    saveMeeting(): void
    {
        // Get the meeting object
        const meeting = this.meetingForm.getRawValue();
        meeting.comunidad = {id: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}
        if(this.editMode){
        // Update the meeting on the server
            this._meetingService.updateMeeting(meeting.id, meeting)
                .subscribe(() =>
                {
                    // Show a success message
                    console.log('Meeting updated');

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }
        else {
            // Create the meeting on the server
            this._meetingService.createMeeting(meeting)
                .subscribe((meeting) =>
                {
                    this._router.navigate(['../' + meeting.id], {relativeTo: this._route});
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
            });
        }
    }

    /**
     * Open the scanning overlay
     */
    openScanningOverlay(): void
    {
        this._meetingService.scanning = this.meeting;
    }

    togglePresence(attendance){
        if(attendance.status === 'PRESENT'){
            attendance.status = 'ABSENT';
            attendance.entryDate = new Date();
        }
        else {
            attendance.status = 'PRESENT';
            attendance.entryDate = new Date();
        }
        attendance.meetingId = this.meeting.id;
        this._meetingService.registerAttendance(attendance).subscribe(
            () => {
                this.presentCount = this.meeting.attendance.filter((a) => a.status === 'PRESENT').length;
                this._changeDetectorRef.markForCheck();
            }
        );
    }


    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.attendanceDataSource.filter = filterValue.trim().toLowerCase();

        if (this.attendanceDataSource.paginator) {
          this.attendanceDataSource.paginator.firstPage();
        }
    }

    createAnnouncement(){
        const date = new Date(this.meeting.date).toLocaleDateString();
        const announcement: Announcement = {title: "Convocatoria reunión " + date,meeting: this.meeting, comunidad: {id: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}}
        this._announcementService.createAnnouncement(announcement).subscribe((announcement) => {
            this._router.navigate(['/announcements/' + announcement.id], {relativeTo: this._route});
        });
    }


     /**
     * Open document dialog
     */
     openDocumentDialog(): void
     {
         // Open the dialog
         const dialogRef = this._matDialog.open(UploadDocumentComponent);

         dialogRef.afterClosed()
             .subscribe((result) =>
             {
                this.uploadActa(result);
             });
    }

    uploadActa(doc: {type: string, file: File}){
        const formData = new FormData();
        formData.append('file', doc.file);
        const document = {name: doc.file.name, type: doc.type, comunidad: {id: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}}
        formData.append('document', new Blob([JSON.stringify(document)], { type: "application/json"}));
        this._meetingService.uploadDocument(this.meeting.id, formData).subscribe((response) => {
            this.meeting.documents.push(response);
            this._changeDetectorRef.markForCheck();
        });
    }

    deleteDocument(document){
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Borrar documento',
            message: '¿Estás seguro de que quieres borrar este documento? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Borrar',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) =>
            {
                if ( result === 'confirmed' )
                {
                    this._meetingService.deleteDocument(this.meeting.id, document.id).subscribe(() => {
                        this.meeting.documents = this.meeting.documents.filter((d) => d.id !== document.id);
                        this._changeDetectorRef.markForCheck();
                    });
                }
            }
        );
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

    getFileExtension(document) {
        return this._fileService.getFileExtensionImage(document);
    }

    getDocument(document: any){
        this._fileService.getFileUrlByPath("a09b25f2-897b-4e33-bac5-d5e34f7245ce/" + this.meeting.id + "/" + document.name).subscribe((url) => {
            window.open(url, "_blank");
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

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private compare(a: any, b: any, isAsc: boolean): number {
        if (a < b) {
                return isAsc ? -1 : 1;
        } else if (a > b) {
                return isAsc ? 1 : -1;
        } else {
                return 0;
        }
    }
}

