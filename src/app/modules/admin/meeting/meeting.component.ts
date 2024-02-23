import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
import { Meeting, MeetingAttendance } from './meeting.types';
import { MeetingService } from './meeting.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { fuseAnimations } from '@fuse/animations';

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
    imports        : [RouterOutlet, CommonModule, MatIconModule, ZXingScannerModule],
})
export class MeetingComponent
{

    allowedFormats = [ BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC, BarcodeFormat.CODE_39,  BarcodeFormat.CODE_93,  BarcodeFormat.CODABAR,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.UPC_EAN_EXTENSION, BarcodeFormat.EAN_8, BarcodeFormat.MAXICODE, BarcodeFormat.PDF_417, BarcodeFormat.ITF, BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED, BarcodeFormat.EAN_8];
    scanning$: Observable<Meeting>;
    private _meetingAttendance: BehaviorSubject<MeetingAttendance | null> = new BehaviorSubject(null);
    meetingAttendance$ : Observable<MeetingAttendance> = this._meetingAttendance.asObservable();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(private _meetingService: MeetingService, private _changeDetectorRef: ChangeDetectorRef)
    {
        // Get the meetings
        this.scanning$ = this._meetingService.scanning$.pipe(takeUntil(this._unsubscribeAll))
    }


    scanSuccessHandler(event: any, meeting: Meeting) {
        console.log('Success' + event);
        const attendance : MeetingAttendance = {
            comunero: {id: event},
            meeting: {id: meeting.id},
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

    closeScanningOverlay(){
        this._meetingService.scanning = null;
    }
}
