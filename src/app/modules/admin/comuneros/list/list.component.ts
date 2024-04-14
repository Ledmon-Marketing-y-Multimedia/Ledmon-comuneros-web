import { AsyncPipe, DOCUMENT, I18nPluralPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { ComunerosService } from 'app/modules/admin/comuneros/comuneros.service';
import { Comunero, ComuneroStatus, Country } from 'app/modules/admin/comuneros/comuneros.types';
import { PdfService } from 'app/shared/services/pdf.service';
import { filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ExportModalComponent } from '../export-modal/export-modal.component';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector       : 'comuneros-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatSidenavModule, RouterOutlet, NgIf, MatFormFieldModule, TranslocoModule, MatSelectModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, NgFor, NgClass, RouterLink, AsyncPipe, I18nPluralPipe],
})
export class ComunerosListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    comuneros$: Observable<Comunero[]>;
    comunerosCount: number = 0;
    comunerosTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedComunero: Comunero;
    comuneros: Comunero[];
    comuneroStatuses = Object.values(ComuneroStatus);
    comuneroStatus = ComuneroStatus;
    selectedStatus : string = '';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _comunerosService: ComunerosService,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
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
        // Get the comuneros
        this.comuneros$ = this._comunerosService.comuneros$;
        this._comunerosService.comuneros$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comuneros: Comunero[]) =>
            {
                // Update the counts
                this.comuneros = comuneros;
                this.comunerosCount = comuneros.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the comunero
        this._comunerosService.comunero$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((comunero: Comunero) =>
            {
                // Update the selected comunero
                this.selectedComunero = comunero;

                // Mark for check
                this._changeDetectorRef.markForCheck();
        });


        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                debounceTime(500), // Add debounce time of 300 milliseconds
                takeUntil(this._unsubscribeAll),
                switchMap(query =>
                    // Search
                    this._comunerosService.searchComuneros(query, this.selectedStatus),
                ),
            )
            .subscribe();



        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) =>
        {
            if ( !opened )
            {
                // Remove the selected comunero when drawer closed
                this.selectedComunero = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) =>
            {
                // Set the drawerMode if the given breakpoint is active
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                }
                else
                {
                    this.drawerMode = 'over';
                }

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
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }


    export(): void {
        this._matDialog.open(ExportModalComponent).afterClosed().subscribe((result) => {
            if(result){
                if(result.type === 'SIMPLE'){
                    this._pdfService.comuneroSimpleList(this.comuneros);
                }
                else {
                    this._pdfService.comuneroCompleteList(this.comuneros);
                }
            }
        });
    }

    filterByStatus(): void {
        this._comunerosService.searchComuneros(this.searchInputControl.value, this.selectedStatus).subscribe();
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
