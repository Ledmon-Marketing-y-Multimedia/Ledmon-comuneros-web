import { TextFieldModule } from '@angular/cdk/text-field';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Comunero } from '../../comuneros/comuneros.types';
import { MeetingService } from '../meeting.service';
import { Router } from '@angular/router';

@Component({
    selector       : 'suspend',
    templateUrl    : './suspend.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [NgIf, MatButtonModule, MatIconModule, FormsModule, TextFieldModule, NgFor, MatCheckboxModule, NgClass, MatRippleModule, MatMenuModule, MatDialogModule, AsyncPipe],
})
export class SuspendComponent implements OnInit, OnDestroy
{
    comuneros: Comunero[] | any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) private _data,
        private _matDialogRef: MatDialogRef<SuspendComponent>,
        private _meetingService: MeetingService,
        private _router: Router,
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
        this.comuneros = this._data;
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
     * Create a new note
     *
     * @param note
     */
    createNote(): void
    {
        // this._notesService.createNote(note).pipe(
        //     map(() =>
        //     {
        //         // Get the note
        //         this.note$ = this._notesService.note$;
        //     })).subscribe();
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

    /**
     * Toggle the complete status
     *
     * @param note
     */
    markAll(): void
    {
        this.comuneros.forEach(comunero => comunero.selected = !comunero.selected);
    }

    hasActiveComuneros(): boolean
    {
        return this.comuneros.some(comunero => comunero.selected);
    }


    suspendComuneros(): void
    {
        const selectedComuneros = this.comuneros.filter(comunero => comunero.selected);
        this._meetingService.suspendComuneros("a09b25f2-897b-4e33-bac5-d5e34f7245ce", selectedComuneros).subscribe(
            (announcement) =>
            {
                this._router.navigate(['/announcements/' + announcement.id]);
                this._matDialogRef.close();
            }
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Read the given file for demonstration purposes
     *
     * @param file
     */
    private _readAsDataURL(file: File): Promise<any>
    {
        // Return a new promise
        return new Promise((resolve, reject) =>
        {
            // Create a new reader
            const reader = new FileReader();

            // Resolve the promise on success
            reader.onload = (): void =>
            {
                resolve(reader.result);
            };

            // Reject the promise on error
            reader.onerror = (e): void =>
            {
                reject(e);
            };

            // Read the file as the
            reader.readAsDataURL(file);
        });
    }
}
