import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector     : 'loader-modal',
    standalone   : true,
    templateUrl  : './loader-modal.component.html',
    imports: [MatProgressSpinnerModule],
    encapsulation: ViewEncapsulation.None,
})
export class LoaderModalComponent
{
    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
    )
    {
    }
}
