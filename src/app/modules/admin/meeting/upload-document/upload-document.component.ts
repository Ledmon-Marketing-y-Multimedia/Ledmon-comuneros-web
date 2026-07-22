import { NgIf } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector     : 'upload-document',
    templateUrl  : './upload-document.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports      : [MatButtonModule, MatIconModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, NgIf],
})
export class UploadDocumentComponent implements OnInit
{
    documentForm: UntypedFormGroup;

    /**
     * Constructor
     */
    constructor(
        public matDialogRef: MatDialogRef<UploadDocumentComponent>,
        private _formBuilder: UntypedFormBuilder,
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
        // Create the form
        this.documentForm = this._formBuilder.group({
            type     : ['', [Validators.required]],
            file : ['', Validators.required],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Save and close
     */
    saveAndClose(): void
    {
        // Close the dialog
        this.matDialogRef.close(this.documentForm.getRawValue());
    }

    onFileChange(files : File[]) {
        this.documentForm.get('file').setValue(files[0]);
    }

    /**
     * Discard the message
     */
    discard(): void
    {
        this.matDialogRef.close();
    }
}
