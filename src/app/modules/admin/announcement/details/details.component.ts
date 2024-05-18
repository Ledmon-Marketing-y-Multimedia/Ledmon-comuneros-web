import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
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
import { QuillEditorComponent, QuillModule, QuillModules, QuillService } from 'ngx-quill';
import { ComunerosService } from '../../comuneros/comuneros.service';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PdfService } from 'app/shared/services/pdf.service';
import { MatDialog } from '@angular/material/dialog';
import { LoaderModalComponent } from '../loader-modal/loader-modal.component';
import Quill from 'quill';

@Component({
    selector       : 'announcement-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    providers  : [TitleCasePipe],
    imports        : [NgIf, MatButtonToggleModule, TitleCasePipe, MatButtonModule, QuillEditorComponent, MatTooltipModule, RouterLink, MatIconModule, NgFor, FormsModule, ReactiveFormsModule, MatRippleModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, NgClass, MatSelectModule, MatOptionModule, MatDatepickerModule, TextFieldModule, FuseFindByKeyPipe, DatePipe],
})
export class AnnouncementDetailsComponent implements OnInit, OnDestroy
{
    fontList = ['Arial', 'Courier', 'Garamond', 'Tahoma', 'Times New Roman', 'Verdana'];
    announcement: Announcement;
    announcementForm: UntypedFormGroup;
    comuneros: Comunero[];
    selectedFilter: string = '';
    filters: string[] = ['todos', 'altas', 'suspensos'];
    editMode: boolean = false;
    numberOfComunerosCarta: any = {};
    numberOfComunerosEmail: any = {};
    comunerosCarta: Comunero[];
    comunerosEmail: Comunero[];
    zonas: Set<String> =  new Set<String>();
    selectedZona: string = 'all';
    includeEmailUsers: boolean = false;
    quillModules: QuillModules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ font: ['Arial'] }],
            [{align: []}, {list: 'ordered'}, {list: 'bullet'}],
            ['clean'],
            ['image',],
        ],


    };
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
        private titleCasePipe: TitleCasePipe
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
            comunerosCarta     : [[]],
            comunerosEmail     : [[]],
        });

        // Get the comuneros
        this._comunerosService.comuneros$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((comuneros: Comunero[]) =>
        {
            this.comuneros = comuneros;

            this.comunerosCarta = this.comuneros.filter(comunero => !comunero.emailCommunication);
            this.comunerosEmail = this.comuneros.filter(comunero => comunero.user.email && comunero.emailCommunication);
            this.zonas = new Set(comuneros.map((comunero) => comunero.lugar).map((lugar) => lugar.zona));

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
                this.announcementForm.get('comunerosCarta').setValue(announcement.comuneros.filter(comunero => !comunero.user.email));
                this.announcementForm.get('comunerosEmail').setValue(announcement.comuneros.filter(comunero => comunero.user.email));
                this._filterCards();
                // Mark for check
                this._changeDetectorRef.markForCheck();
        });
        const FontAttributor = Quill.import('attributors/class/font');
        FontAttributor.whitelist = [
            'Arial'
        ];
        Quill.register(FontAttributor, true);
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
        announcement.comuneros = announcement.comunerosCarta.concat(announcement.comunerosEmail);
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
     * On zona change
     *
     */
    onChange(): void
    {
        this._calcNumberOfCards();
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
        const comuneros = this.announcementForm.get('comunerosCarta').value;
        const content = this.announcementForm.get('content').value;
        const a  = '<div style="background-color: #11ffee00;width: 100%; font-family: "Arial", sans-serif; font-style: normal;" class="ql-editor">' + content + '</div>'
        const blobs = [];
        const loader = this._matDialog.open(LoaderModalComponent, {data: {blobs: blobs, comuneros: comuneros.length}});
        const context = this;

        async function printPDF(comunero) {
            return new Promise((resolve) => {
                comunero.user.name = context.titleCasePipe.transform(comunero.user.name);
                comunero.lugar.address = context.titleCasePipe.transform(comunero.lugar.address);
                comunero.lugar.poblacion = context.titleCasePipe.transform(comunero.lugar.poblacion);
                context._pdfService.print(comunero, a, context.announcement.meeting != undefined).then((result) => {
                    blobs.push(result);
                    resolve(true);
                });
            });
        }

        async function combinePDF() {
            return new Promise((resolve) => {
                context._pdfService.combinePdf(blobs).then((result) => {
                    loader.close();
                    resolve(true);
                });
            });
        }

        async function printAllPDFs() {
            for (let i = 0; i < comuneros.length; i++) {
                await printPDF(comuneros[i]);
            }
            await combinePDF();
        }

        setTimeout(() => {
            printAllPDFs();
        }, 1000);

    }

    sendEmail(){
        const announcement = this.announcementForm.getRawValue();
        announcement.comuneros = announcement.comunerosEmail;
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
        this.numberOfComunerosCarta = {};
        this.numberOfComunerosEmail = {};

        // Go through the filters
        this.filters.forEach((filter) =>
        {
            // For each filter, calculate the card count
            switch ( filter ){
                case 'todos':
                    this.numberOfComunerosCarta[filter] = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER).length;
                    this.numberOfComunerosEmail[filter] = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER).length;
                    break;
                case 'suspensos':
                    this.numberOfComunerosCarta[filter] = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED).length;
                    this.numberOfComunerosEmail[filter] = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED).length;
                    break;
                case 'altas':
                    this.numberOfComunerosCarta[filter] = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE).length;
                    this.numberOfComunerosEmail[filter] = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE).length;
                    break;
                default:
                    break;
            }

            if(this.includeEmailUsers){
                this.numberOfComunerosCarta[filter] += this.numberOfComunerosEmail[filter];
            }

        });
    }


    /**
     * Filter the cards based on the selected filter
     *
     * @private
     */
    private _filterCards(): void
    {
        let comunerosCarta = [];
        let comunerosEmail = [];
        switch ( this.selectedFilter ){
            case 'todos':
                comunerosCarta = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER);
                comunerosEmail = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER);
                break;
            case 'suspensos':
                comunerosCarta = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED);
                comunerosEmail = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.SUSPENDED);
                break;
            case 'altas':
                comunerosCarta = this.comunerosCarta.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE);
                comunerosEmail = this.comunerosEmail.filter(comunero => comunero.role === ComuneroRole.HOLDER && comunero.lugar.status === LugarStatus.ACTIVE);
                break;
            default:
                comunerosCarta = this.comunerosCarta.filter(comuneroCarta =>
                    this.announcement.comuneros.some(comunero => comunero.id === comuneroCarta.id)
                );
                comunerosEmail = this.comunerosEmail.filter(comunerosEmail =>
                    this.announcement.comuneros.some(comunero => comunero.id === comunerosEmail.id)
                );
                break;
        }
        if(this.selectedZona !== 'all'){
            comunerosCarta = comunerosCarta.filter(comunero => comunero.lugar.zona === this.selectedZona);
            comunerosEmail = comunerosEmail.filter(comunero => comunero.lugar.zona === this.selectedZona);
        }
        if(this.includeEmailUsers){
            comunerosCarta = comunerosCarta.concat(comunerosEmail);
        }
        this.announcementForm.get('comunerosCarta').setValue(comunerosCarta);
        this.announcementForm.get('comunerosEmail').setValue(comunerosEmail);
        this._changeDetectorRef.markForCheck();
    }
}
