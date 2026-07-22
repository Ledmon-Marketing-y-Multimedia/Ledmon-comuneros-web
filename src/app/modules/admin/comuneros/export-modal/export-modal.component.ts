import { NgClass } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector     : 'export-modal',
    standalone   : true,
    templateUrl  : './export-modal.component.html',
    imports: [NgClass, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
    encapsulation: ViewEncapsulation.None,
})
export class ExportModalComponent
{
    exportForm: UntypedFormGroup;
    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<ExportModalComponent>,
        private _formBuilder: UntypedFormBuilder,
    )
    {
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.exportForm = this._formBuilder.group({
            type     : ['', [Validators.required]],
        });
    }

    /**
     * Save and close
     */
    saveAndClose(): void
    {
        // Close the dialog
        this.matDialogRef.close(this.exportForm.getRawValue());
    }

    /**
     * Discard the message
     */
    discard(): void
    {
        this.matDialogRef.close();
    }
}
