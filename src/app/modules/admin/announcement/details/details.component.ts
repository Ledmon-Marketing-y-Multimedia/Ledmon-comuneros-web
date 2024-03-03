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
import { LugaresService } from 'app/modules/admin/lugares/lugares.service';
import { Lugar } from 'app/modules/admin/lugares/lugares.types';
import { LugaresListComponent } from 'app/modules/admin/lugares/list/list.component';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { Comunero, ComuneroRole } from '../../comuneros/comuneros.types';

@Component({
    selector       : 'lugares-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [NgIf, MatButtonModule, MatTooltipModule, RouterLink, MatIconModule, NgFor, FormsModule, ReactiveFormsModule, MatRippleModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, NgClass, MatSelectModule, MatOptionModule, MatDatepickerModule, TextFieldModule, FuseFindByKeyPipe, DatePipe],
})
export class LugaresDetailsComponent implements OnInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;

    editMode: boolean = false;
    lugar: Lugar;
    lugarForm: UntypedFormGroup;
    lugares: Lugar[];
    comunero: Comunero;
    autorizados: Comunero[];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _lugaresListComponent: LugaresListComponent,
        private _lugaresService: LugaresService,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
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
        this._lugaresListComponent.matDrawer.open();

        // Create the lugar form
        this.lugarForm = this._formBuilder.group({
            id          : [''],
            address        : ['', [Validators.required]],
            poblacion       : [''],
            zona     : [''],
            cp     : [''],
            autorizados: this._formBuilder.array([]),
        });

        // Get the lugares
        this._lugaresService.lugares$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lugares: Lugar[]) =>
            {
                this.lugares = lugares;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the lugar
        this._lugaresService.lugar$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lugar: Lugar) =>
            {
                // Open the drawer in case it is closed
                this._lugaresListComponent.matDrawer.open();

                // Get the lugar
                this.lugar = lugar;

                // Patch values to the form
                this.lugarForm.patchValue(lugar);

                // Clear the phoneNumbers form arrays
                (this.lugarForm.get('autorizados') as UntypedFormArray).clear();

                // Setup the phone numbers form array
                const autorizadosFormGroups = [];

                this.comunero = lugar.comuneros.find(x => x.role == ComuneroRole.HOLDER);

                this.autorizados = lugar.comuneros.filter(x => x.role ==  ComuneroRole.AUTHORIZED);
                if ( this.autorizados.length > 0 )
                {
                    this.autorizados.forEach((autorizado) =>
                    {
                        const formGroup = this._formBuilder.group({
                            id: [autorizado.id],
                            name: [autorizado.user.name],
                            dni      : [autorizado.user.dni],
                        });
                        formGroup.disable();
                        autorizadosFormGroups.push(
                            formGroup
                        );
                    });
                }
                else
                {
                    autorizadosFormGroups.push(
                        this._formBuilder.group({
                            name: [''],
                            dni      : [''],
                        }),
                    );
                }

                autorizadosFormGroups.forEach((formGroup) =>
                {
                    (this.lugarForm.get('autorizados') as UntypedFormArray).push(formGroup);
                });

                // Toggle the edit mode off
                this.toggleEditMode(false);

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
        return this._lugaresListComponent.matDrawer.close();
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
     * Update the lugar
     */
    updateLugar(): void
    {
        // Get the lugar object
        const lugar = this.lugarForm.getRawValue();

        const autorizados = lugar.autorizados.filter(x => x.name != '' && x.dni != '');

        lugar.comuneros = autorizados.map((autorizado) => {
            return {
                user: {
                    name: autorizado.name,
                    dni: autorizado.dni
                },
                id: autorizado.id,
                role: ComuneroRole.AUTHORIZED
            }
        });
        lugar.autorizados = null;

        // Update the lugar on the server
        this._lugaresService.updateLugares(lugar.id, lugar).subscribe(() =>
        {
            // Toggle the edit mode off
            this.toggleEditMode(false);
        });
    }

    /**
     * Delete the lugar
     */
    deleteLugar(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete lugar',
            message: 'Are you sure you want to delete this lugar? This action cannot be undone!',
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
                // Get the current lugar's id
                const id = this.lugar.id;

                // Get the next/previous lugar's id
                const currentLugarIndex = this.lugares.findIndex(item => item.id === id);
                const nextLugarIndex = currentLugarIndex + ((currentLugarIndex === (this.lugares.length - 1)) ? -1 : 1);
                const nextLugarId = (this.lugares.length === 1 && this.lugares[0].id === id) ? null : this.lugares[nextLugarIndex].id;

                // Delete the lugar
                this._lugaresService.deleteLugares(id)
                    .subscribe(() =>
                    {

                        // Navigate to the next lugar if available
                        if ( nextLugarId )
                        {
                            this._router.navigate(['../', nextLugarId], {relativeTo: this._activatedRoute});
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
     * Add an empty autorizado field
     */
    addAutorizadoField(): void
    {
        const autorizadoFormGroup = this._formBuilder.group({
            name    : [''],
            dni: [''],
        });

        // Add the phone number form group to the phoneNumbers form array
        (this.lugarForm.get('autorizados') as UntypedFormArray).push(autorizadoFormGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove the autorizado field
     *
     * @param index
     */
    removeAutorizadoField(index: number): void
    {
        const autorizadoFormArray = this.lugarForm.get('autorizados') as UntypedFormArray;

        // Remove the phone number field
        autorizadoFormArray.removeAt(index);

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
