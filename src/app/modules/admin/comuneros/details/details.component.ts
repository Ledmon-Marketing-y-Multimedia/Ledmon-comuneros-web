import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComunerosService } from 'app/modules/admin/comuneros/comuneros.service';
import { Comunero, ComuneroStatus, Country, NewComunero, Tag } from 'app/modules/admin/comuneros/comuneros.types';
import { ComunerosListComponent } from 'app/modules/admin/comuneros/list/list.component';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { LugaresService } from '../../lugares/lugares.service';
import { Lugar } from '../../lugares/lugares.types';
import { PdfService } from 'app/shared/services/pdf.service';
import { MatDialog } from '@angular/material/dialog';
import { StatusModalComponent } from '../status-modal/status-modal.component';

@Component({
    selector       : 'comuneros-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [NgIf, MatButtonModule, MatTooltipModule, RouterLink, MatIconModule, NgFor, FormsModule, ReactiveFormsModule, MatRippleModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, NgClass, MatSelectModule, MatOptionModule, MatDatepickerModule, TextFieldModule, FuseFindByKeyPipe, DatePipe],
})
export class ComunerosDetailsComponent implements OnInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;

    editMode: boolean = false;
    comunero: Comunero;
    comuneroForm: UntypedFormGroup;
    comuneros: Comunero[];
    lugares: Lugar[];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    attendanceCount: number;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _comunerosListComponent: ComunerosListComponent,
        private _comunerosService: ComunerosService,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _router: Router,
        private _lugaresService: LugaresService,
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
        // Open the drawer
        this._comunerosListComponent.matDrawer.open();

        // Create the comunero form
        this.comuneroForm = this._formBuilder.group({
            id          : [''],
            avatar      : [null],
            name        : ['', [Validators.required]],
            phones: this._formBuilder.array([]),
            lugarId       : [''],
            email       : [''],
            username    : [''],
            code       : [''],
            dni     : [''],
        });

        // Get the comuneros
        this._comunerosService.comuneros$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comuneros: Comunero[]) =>
            {
                this.comuneros = comuneros;

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

        // Get the lugares
        this._lugaresService.lugares$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lugares: Lugar[]) => {
                this.lugares = lugares;

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

        // Get the comunero
        this._comunerosService.comunero$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comunero: Comunero) =>
            {
                // Open the drawer in case it is closed
                this._comunerosListComponent.matDrawer.open();

                // Get the comunero
                this.comunero = comunero;

                this.attendanceCount = comunero.attendances.filter(x => x.status == 'PRESENT').length;

                this.comuneroForm.get('lugarId').setValue(comunero.lugar?.id || '');

                // Clear the phones form arrays
                (this.comuneroForm.get('phones') as UntypedFormArray).clear();

                // Patch values to the form
                this.comuneroForm.patchValue(comunero.user);

                this.comuneroForm.get('id').setValue(comunero.id);

                // Setup the phone numbers form array
                const phonesFormGroups = [];

                if ( comunero.user?.phones?.length > 0 )
                {
                    // Iterate through them
                    comunero.user.phones.forEach((phoneNumber) =>
                    {
                        // Create an email form group
                        phonesFormGroups.push(
                            this._formBuilder.group({
                                phoneNumber: [phoneNumber.phoneNumber],
                                label      : [phoneNumber.label],
                            }),
                        );
                    });
                }
                else
                {
                    // Create a phone number form group
                    phonesFormGroups.push(
                        this._formBuilder.group({
                            phoneNumber: [''],
                            label      : [''],
                        }),
                    );
                }

                // Add the phone numbers form groups to the phone numbers form array
                phonesFormGroups.forEach((phonesFormGroup) =>
                {
                    (this.comuneroForm.get('phones') as UntypedFormArray).push(phonesFormGroup);
                });

                // Toggle the edit mode off
                this.toggleEditMode(comunero.user.name == '');

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

        // Dispose the overlays if they are still on the DOM
        if ( this._tagsPanelOverlayRef )
        {
            this._tagsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._comunerosListComponent.matDrawer.close();
    }

    /**
     * Toggle edit mode
     *
     * @param editMode
     */
    toggleEditMode(editMode: boolean | null = null): void
    {
        if ( editMode === null )
        {
            this.editMode = !this.editMode;
        }
        else
        {
            this.editMode = editMode;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Update the comunero
     */
    updateComunero(): void
    {
        // Get the comunero object
        const comunero = this.comuneroForm.getRawValue();
        comunero.phones = comunero.phones.filter(phoneNumber => phoneNumber.phoneNumber);

        if(comunero.id == ''){
            const newComunero : NewComunero = comunero;
            newComunero.role = 'HOLDER';
            // Update the comunero on the server
            this._comunerosService.createComunero(newComunero).subscribe((comunero : Comunero) => {
                this._router.navigate(['../', comunero.id], {relativeTo: this._activatedRoute});
            })
        }
        // Update the comunero on the server
        else this._comunerosService.updateComunero(comunero.id, comunero).subscribe(() =>
        {
            // Toggle the edit mode off
            this.toggleEditMode(false);
        });
    }

    changeStatus(): void {
        this._matDialog.open(StatusModalComponent, {data: this.comunero}).afterClosed().subscribe((result) => {
            if(result){
                const comunero = {comments: result.comments, status: ComuneroStatus.UNSUBSCRIBED};
                this._comunerosService.updateComuneroStatus(this.comunero.id, comunero).subscribe((comunero) => {
                });
            }
        });
    }

    /**
     * Delete the comunero
     */
    deleteComunero(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete comunero',
            message: 'Are you sure you want to delete this comunero? This action cannot be undone!',
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
                // Get the current comunero's id
                const id = this.comunero.id;

                // Get the next/previous comunero's id
                const currentComuneroIndex = this.comuneros.findIndex(item => item.id === id);
                const nextComuneroIndex = currentComuneroIndex + ((currentComuneroIndex === (this.comuneros.length - 1)) ? -1 : 1);
                const nextComuneroId = (this.comuneros.length === 1 && this.comuneros[0].id === id) ? null : this.comuneros[nextComuneroIndex].id;

                // Delete the comunero
                this._comunerosService.deleteComunero(id)
                    .subscribe((isDeleted) =>
                    {
                        // Return if the comunero wasn't deleted...
                        if ( !isDeleted )
                        {
                            return;
                        }

                        // Navigate to the next comunero if available
                        if ( nextComuneroId )
                        {
                            this._router.navigate(['../', nextComuneroId], {relativeTo: this._activatedRoute});
                        }
                        // Otherwise, navigate to the parent
                        else
                        {
                            this._router.navigate(['../'], {relativeTo: this._activatedRoute});
                        }

                        // Toggle the edit mode off
                        this.toggleEditMode(false);
                    });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    /**
     * Add an empty phone number field
     */
    addPhoneNumberField(): void
    {
        // Create an empty phone number form group
        const phoneNumberFormGroup = this._formBuilder.group({
            country    : ['us'],
            phoneNumber: [''],
            label      : [''],
        });

        // Add the phone number form group to the phones form array
        (this.comuneroForm.get('phones') as UntypedFormArray).push(phoneNumberFormGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove the phone number field
     *
     * @param index
     */
    removePhoneNumberField(index: number): void
    {
        // Get form array for phone numbers
        const phonesFormArray = this.comuneroForm.get('phones') as UntypedFormArray;

        // Remove the phone number field
        phonesFormArray.removeAt(index);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    comuneroCard(){
        this._pdfService.comuneroCard(this.comunero);
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
