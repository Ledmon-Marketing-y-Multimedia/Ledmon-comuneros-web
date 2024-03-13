import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { AnnouncementService } from 'app/modules/admin/announcement/announcement.service';
import { Announcement } from 'app/modules/admin/announcement/announcement.types';
import { Subject, filter, takeUntil } from 'rxjs';
import { Comunero, ComuneroRole, LugarStatus } from '../../comuneros/comuneros.types';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import { ComunerosService } from '../../comuneros/comuneros.service';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PdfService } from 'app/shared/services/pdf.service';
import { MatDialog } from '@angular/material/dialog';
import { LoaderModalComponent } from '../loader-modal/loader-modal.component';

@Component({
    selector       : 'announcement-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [NgIf, MatButtonToggleModule, TitleCasePipe, MatButtonModule, QuillEditorComponent, MatTooltipModule, RouterLink, MatIconModule, NgFor, FormsModule, ReactiveFormsModule, MatRippleModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, NgClass, MatSelectModule, MatOptionModule, MatDatepickerModule, TextFieldModule, FuseFindByKeyPipe, DatePipe],
})
export class AnnouncementDetailsComponent implements OnInit, OnDestroy
{
    announcement: Announcement;
    announcementForm: UntypedFormGroup;
    comuneros: Comunero[];
    selectedFilter: string = '';
    filters: string[] = ['all', 'active', 'suspended'];
    editMode: boolean = false;
    numberOfComuneros: any = {};
    quillModules: QuillModules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{align: []}, {list: 'ordered'}, {list: 'bullet'}],
            ['clean'],
            [{ size: [ 'small', false, 'large', 'huge' ]}]
        ],

    };
    blobs
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _announcementService: AnnouncementService,
        private _formBuilder: UntypedFormBuilder,
        private _comunerosService: ComunerosService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _pdfService: PdfService,
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
        // Create the announcement form
        this.announcementForm = this._formBuilder.group({
            id          : [undefined],
            title        : ['', [Validators.required]],
            content       : [''],
            comuneros     : [[]],
        });

        // Get the comuneros
        this._comunerosService.comuneros$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((comuneros: Comunero[]) =>
        {
            this.comuneros = comuneros;

            this._calcNumberOfCards();

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // Get the announcement
        this._announcementService.announcement$
            .pipe(filter(Boolean),takeUntil(this._unsubscribeAll))
            .subscribe((announcement: Announcement) =>
            {
                this.announcement = announcement;
                this.editMode = true;
                this.announcementForm.patchValue(announcement);
                this._filterCards();
                // Mark for check
                this._changeDetectorRef.markForCheck();
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
     * Update the announcement
     */
    saveAnnouncement(): void
    {
        // Get the announcement object
        const announcement = this.announcementForm.getRawValue();
        announcement.comunidad = {id: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}
        if(this.editMode){
        // Update the announcement on the server
            this._announcementService.updateAnnouncement(announcement.id, announcement)
                .subscribe(() =>
                {
                    // Show a success message
                    console.log('Announcement updated');

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }
        else {
            // Create the announcement on the server
            this._announcementService.createAnnouncement(announcement)
                .subscribe((announcement) =>
                {
                    this._router.navigate(['../' + announcement.id], {relativeTo: this._route});
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
            });
        }
    }

    /**
     * On filter change
     *
     * @param change
     */
    onFilterChange(change: MatButtonToggleChange): void
    {
        // Set the filter
        this.selectedFilter = change.value;

        // Filter the cards
        this._filterCards();
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


    printComunications(){
        const comuneros = this.announcementForm.get('comuneros').value;
        const content = this.announcementForm.get('content').value;
        const blobs = [];
        const loader = this._matDialog.open(LoaderModalComponent, {data: {blobs: blobs, comuneros: comuneros.length}})
        setTimeout(() => {
            comuneros.forEach((comunero, index) => {
                this._pdfService.print(comunero, content).then((result) => {
                    blobs.push(result);
                    if(index === comuneros.length - 1){
                        this._pdfService.combinePdf(blobs).then((result) => {
                            loader.close();
                        });
                    }
            });
        });
        }, 1000);

    }

    sendEmail(){
        const announcement = this.announcementForm.getRawValue();
        this._announcementService.sendEmail(announcement).subscribe(() => {
            console.log('Email sent');
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _calcNumberOfCards(): void
    {
        // Prepare the numberOfCards object
        this.numberOfComuneros = {};

        // Go through the filters
        this.filters.forEach((filter) =>
        {
            // For each filter, calculate the card count
            switch ( filter ){
                case 'all':
                    this.numberOfComuneros[filter] = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER).length;
                    break;
                case 'suspended':
                    this.numberOfComuneros[filter] = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED).length;
                    break;
                case 'active':
                    this.numberOfComuneros[filter] = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE).length;
                    break;
                default:
                    break;
            }

            // Fill the numberOfCards object with the counts
        });
    }

    /**
     * Filter the cards based on the selected filter
     *
     * @private
     */
    private _filterCards(): void
    {
        let comuneros = [];
        switch ( this.selectedFilter ){
            case 'all':
                comuneros = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER);
                break;
            case 'suspended':
                comuneros = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED);
                break;
            case 'active':
                comuneros = this.comuneros.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE);
                break;
            default:
                comuneros = this.comuneros;
                break;
        }
        this.announcementForm.get('comuneros').setValue(comuneros);
    }
}
