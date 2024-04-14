import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, Observable, Subject, filter, finalize, fromEvent, take, takeUntil } from 'rxjs';
import { Meeting, MeetingAttendance } from './meeting.types';
import { MeetingService } from './meeting.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { fuseAnimations } from '@fuse/animations';
import { FuseCardComponent } from '@fuse/components/card';
import { MatButtonModule } from '@angular/material/button';
import { ManualSearchComponent } from './manual-search/manual-search.component';

@Component({
    selector       : 'meeting',
    templateUrl    : './meeting.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    animations     : fuseAnimations,
    styles: [`
        video {
            height: 100vh !important;
            width: 100vw !important;
            object-fit: cover;
        }
    `],
    imports        : [RouterOutlet, CommonModule, MatIconModule, ZXingScannerModule, FuseCardComponent, MatButtonModule, ManualSearchComponent],
})
export class MeetingComponent
{
    @ViewChild(ZXingScannerComponent) scanner: ZXingScannerComponent;
    allowedFormats = [ BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC, BarcodeFormat.CODE_39,  BarcodeFormat.CODE_93,  BarcodeFormat.CODABAR,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.UPC_EAN_EXTENSION, BarcodeFormat.EAN_8, BarcodeFormat.MAXICODE, BarcodeFormat.PDF_417, BarcodeFormat.ITF, BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED, BarcodeFormat.EAN_8];
    scanning$: Observable<Meeting>;
    private _meetingAttendance: BehaviorSubject<MeetingAttendance | null> = new BehaviorSubject(null);
    meetingAttendance$ : Observable<MeetingAttendance> = this._meetingAttendance.asObservable();
    private _selectingMeeting: BehaviorSubject<MeetingAttendance[] | null> = new BehaviorSubject(null);
    selectingMeeting$ : Observable<MeetingAttendance[]> = this._selectingMeeting.asObservable();
    presentCount: number;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    selectedAttendance: MeetingAttendance;
    inProgress: boolean;
    /**
     * Constructor
     */
    constructor(private _meetingService: MeetingService,
                @Inject(DOCUMENT) private _document: any,
    )
    {
        this.scanning$ = this._meetingService.scanning$.pipe(takeUntil(this._unsubscribeAll))

        this._meetingService.meeting$.pipe(takeUntil(this._unsubscribeAll)).subscribe((meeting) => {
            this.presentCount = meeting.attendance.filter((a) => a.status === 'PRESENT').length;
        });
        // this._manualSearch.openPanel();

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.key === 'Escape')
                ),
            )
            .subscribe(() =>
            {
                this.closeScanningOverlay();
            });
    }


    scanSuccessHandler(event: any, meeting: Meeting) {
        if(!this.inProgress){
            this.inProgress = true;
            this._meetingAttendance.value ? null :
            this._meetingService.getAnnouncementAttendance(meeting.id, event).pipe(take(1))
                .subscribe((attendances: MeetingAttendance[]) => {
                    if (attendances.length) {
                        this._selectingMeeting.next(attendances);
                    }
                    else {
                        this.registerAttendance(attendances[0]);
                    }
            });
        }
    }

    registerAttendance(attendance: MeetingAttendance){
        attendance.status = 'PRESENT';
        this._meetingService.registerAttendance(attendance).pipe(take(1)).subscribe(
            (result) => {
                this._selectingMeeting.next(null);
                this._meetingAttendance.next(attendance);
                this.presentCount = result.filter((a) => a.status === 'PRESENT').length;
                let snd = new Audio("assets/sounds/ping.mp3");
                snd.play();
                console.log('Attendance registered');
                setTimeout(() => {
                    this._meetingAttendance.next(null);
                    this.inProgress = false;
                }, 3000);
            },
            (error) => {
                console.error('Error registering attendance', error);
            }
        );
    }

    scanErrorHandler(event: any) {
    }

    scanFailureHandler(event: any) {
    }

    closeScanningOverlay(){
        this._meetingService.scanning = null;
    }

    registerRepresentation(attendances: MeetingAttendance[]){
        this.selectedAttendance = attendances[0];
    }
}
