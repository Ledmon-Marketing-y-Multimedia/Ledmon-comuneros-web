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
    contactForm: UntypedFormGroup;
    lugares: Lugar[];
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

        // Create the comunero form
        this.contactForm = this._formBuilder.group({
            id          : [''],
            avatar      : [null],
            name        : ['', [Validators.required]],
            emails      : this._formBuilder.array([]),
            phoneNumbers: this._formBuilder.array([]),
            title       : [''],
            company     : [''],
            birthday    : [null],
            address     : [null],
            notes       : [null],
            tags        : [[]],
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

        // Get the comunero
        this._lugaresService.comunero$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comunero: Lugar) =>
            {
                // Open the drawer in case it is closed
                this._lugaresListComponent.matDrawer.open();

                // Get the comunero
                this.lugar = comunero;

                // Clear the emails and phoneNumbers form arrays
                (this.contactForm.get('emails') as UntypedFormArray).clear();
                (this.contactForm.get('phoneNumbers') as UntypedFormArray).clear();

                // Patch values to the form
                this.contactForm.patchValue(comunero);

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
     * Update the comunero
     */
    updateContact(): void
    {
        // Get the comunero object
        const comunero = this.contactForm.getRawValue();

        // Go through the comunero object and clear empty values
        comunero.emails = comunero.emails.filter(email => email.email);

        comunero.phoneNumbers = comunero.phoneNumbers.filter(phoneNumber => phoneNumber.phoneNumber);

        // Update the comunero on the server
        this._lugaresService.updateContact(comunero.id, comunero).subscribe(() =>
        {
            // Toggle the edit mode off
            this.toggleEditMode(false);
        });
    }

    /**
     * Delete the comunero
     */
    deleteContact(): void
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
                const id = this.lugar.id;

                // Get the next/previous comunero's id
                const currentContactIndex = this.lugares.findIndex(item => item.id === id);
                const nextContactIndex = currentContactIndex + ((currentContactIndex === (this.lugares.length - 1)) ? -1 : 1);
                const nextContactId = (this.lugares.length === 1 && this.lugares[0].id === id) ? null : this.lugares[nextContactIndex].id;

                // Delete the comunero
                this._lugaresService.deleteContact(id)
                    .subscribe((isDeleted) =>
                    {
                        // Return if the comunero wasn't deleted...
                        if ( !isDeleted )
                        {
                            return;
                        }

                        // Navigate to the next comunero if available
                        if ( nextContactId )
                        {
                            this._router.navigate(['../', nextContactId], {relativeTo: this._activatedRoute});
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
     * Upload avatar
     *
     * @param fileList
     */
    uploadAvatar(fileList: FileList): void
    {
        // Return if canceled
        if ( !fileList.length )
        {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        const file = fileList[0];

        // Return if the file is not allowed
        if ( !allowedTypes.includes(file.type) )
        {
            return;
        }

        // Upload the avatar
        this._lugaresService.uploadAvatar(this.lugar.id, file).subscribe();
    }

    /**
     * Remove the avatar
     */
    removeAvatar(): void
    {
        // Get the form control for 'avatar'
        const avatarFormControl = this.contactForm.get('avatar');

        // Set the avatar as null
        avatarFormControl.setValue(null);

        // Set the file input value as null
        this._avatarFileInput.nativeElement.value = null;

        // Update the comunero
        // this.comunero.avatar = null;
    }


    // /**
    //  * Toggle the tags edit mode
    //  */
    // toggleTagsEditMode(): void
    // {
    //     this.tagsEditMode = !this.tagsEditMode;
    // }

    // /**
    //  * Filter tags
    //  *
    //  * @param event
    //  */
    // filterTags(event): void
    // {
    //     // Get the value
    //     const value = event.target.value.toLowerCase();

    //     // Filter the tags
    //     this.filteredTags = this.tags.filter(tag => tag.title.toLowerCase().includes(value));
    // }

    // /**
    //  * Filter tags input key down event
    //  *
    //  * @param event
    //  */
    // filterTagsInputKeyDown(event): void
    // {
    //     // Return if the pressed key is not 'Enter'
    //     if ( event.key !== 'Enter' )
    //     {
    //         return;
    //     }

    //     // If there is no tag available...
    //     if ( this.filteredTags.length === 0 )
    //     {
    //         // Create the tag
    //         this.createTag(event.target.value);

    //         // Clear the input
    //         event.target.value = '';

    //         // Return
    //         return;
    //     }

    //     // If there is a tag...
    //     const tag = this.filteredTags[0];
    //     const isTagApplied = this.comunero.tags.find(id => id === tag.id);

    //     // If the found tag is already applied to the comunero...
    //     if ( isTagApplied )
    //     {
    //         // Remove the tag from the comunero
    //         this.removeTagFromContact(tag);
    //     }
    //     else
    //     {
    //         // Otherwise add the tag to the comunero
    //         this.addTagToContact(tag);
    //     }
    // }

    // /**
    //  * Create a new tag
    //  *
    //  * @param title
    //  */
    // createTag(title: string): void
    // {
    //     const tag = {
    //         title,
    //     };

    //     // Create tag on the server
    //     this._lugaresService.createTag(tag)
    //         .subscribe((response) =>
    //         {
    //             // Add the tag to the comunero
    //             this.addTagToContact(response);
    //         });
    // }

    // /**
    //  * Update the tag title
    //  *
    //  * @param tag
    //  * @param event
    //  */
    // updateTagTitle(tag: Tag, event): void
    // {
    //     // Update the title on the tag
    //     tag.title = event.target.value;

    //     // Update the tag on the server
    //     this._lugaresService.updateTag(tag.id, tag)
    //         .pipe(debounceTime(300))
    //         .subscribe();

    //     // Mark for check
    //     this._changeDetectorRef.markForCheck();
    // }

    // /**
    //  * Delete the tag
    //  *
    //  * @param tag
    //  */
    // deleteTag(tag: Tag): void
    // {
    //     // Delete the tag from the server
    //     this._lugaresService.deleteTag(tag.id).subscribe();

    //     // Mark for check
    //     this._changeDetectorRef.markForCheck();
    // }

    // /**
    //  * Add tag to the comunero
    //  *
    //  * @param tag
    //  */
    // addTagToContact(tag: Tag): void
    // {
    //     // Add the tag
    //     this.comunero.tags.unshift(tag.id);

    //     // Update the comunero form
    //     this.contactForm.get('tags').patchValue(this.comunero.tags);

    //     // Mark for check
    //     this._changeDetectorRef.markForCheck();
    // }

    // /**
    //  * Remove tag from the comunero
    //  *
    //  * @param tag
    //  */
    // removeTagFromContact(tag: Tag): void
    // {
    //     // Remove the tag
    //     this.comunero.tags.splice(this.comunero.tags.findIndex(item => item === tag.id), 1);

    //     // Update the comunero form
    //     this.contactForm.get('tags').patchValue(this.comunero.tags);

    //     // Mark for check
    //     this._changeDetectorRef.markForCheck();
    // }

    // /**
    //  * Toggle comunero tag
    //  *
    //  * @param tag
    //  */
    // toggleContactTag(tag: Tag): void
    // {
    //     if ( this.comunero.tags.includes(tag.id) )
    //     {
    //         this.removeTagFromContact(tag);
    //     }
    //     else
    //     {
    //         this.addTagToContact(tag);
    //     }
    // }

    /**
     * Add the email field
     */
    addEmailField(): void
    {
        // Create an empty email form group
        const emailFormGroup = this._formBuilder.group({
            email: [''],
            label: [''],
        });

        // Add the email form group to the emails form array
        (this.contactForm.get('emails') as UntypedFormArray).push(emailFormGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove the email field
     *
     * @param index
     */
    removeEmailField(index: number): void
    {
        // Get form array for emails
        const emailsFormArray = this.contactForm.get('emails') as UntypedFormArray;

        // Remove the email field
        emailsFormArray.removeAt(index);

        // Mark for check
        this._changeDetectorRef.markForCheck();
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

        // Add the phone number form group to the phoneNumbers form array
        (this.contactForm.get('phoneNumbers') as UntypedFormArray).push(phoneNumberFormGroup);

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
        const phoneNumbersFormArray = this.contactForm.get('phoneNumbers') as UntypedFormArray;

        // Remove the phone number field
        phoneNumbersFormArray.removeAt(index);

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
