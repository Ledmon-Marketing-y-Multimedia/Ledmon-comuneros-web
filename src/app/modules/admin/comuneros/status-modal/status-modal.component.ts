import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector     : 'status-modal',
    standalone   : true,
    templateUrl  : './status-modal.component.html',
    imports: [MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
    encapsulation: ViewEncapsulation.None,
})
export class StatusModalComponent
{
    statusForm: UntypedFormGroup;
    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<StatusModalComponent>,
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
        this.statusForm = this._formBuilder.group({
            comments     : ['', []],
        });
    }

    /**
     * Save and close
     */
    saveAndClose(): void
    {
        // Close the dialog
        this.matDialogRef.close(this.statusForm.getRawValue());
    }

    /**
     * Discard the message
     */
    discard(): void
    {
        this.matDialogRef.close();
    }
}
