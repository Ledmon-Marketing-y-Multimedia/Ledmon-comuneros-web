import { AsyncPipe, DOCUMENT, I18nPluralPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { LugaresService } from 'app/modules/admin/lugares/lugares.service';
import { Lugar } from 'app/modules/admin/lugares/lugares.types';
import { filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector       : 'lugares-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatPaginatorModule, MatSelectModule, MatTableModule, MatSortModule, MatSidenavModule, RouterOutlet, NgIf, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, NgFor, NgClass, RouterLink, AsyncPipe, I18nPluralPipe],
})
export class LugaresListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    lugares$: Observable<Lugar[]>;

    lugaresCount: number = 0;
    lugaresTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    lugarDataSource: MatTableDataSource<Lugar> = new MatTableDataSource<Lugar>();
    lugarTableColumns: string[] = ['address', 'status', 'zona'];
    zonas: Set<String> =  new Set<String>();
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedLugar: Lugar;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    lugares: Lugar[];

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _lugaresService: LugaresService,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
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
        // Get the lugares
        this.lugares$ = this._lugaresService.lugares$;
        this._lugaresService.lugares$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lugares: Lugar[]) =>
            {
                this.lugares = lugares;
                this.lugarDataSource.data = lugares;
                // Update the counts
                this.lugaresCount = lugares.length;

                this.zonas = new Set(lugares.map((lugar) => lugar.zona));

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the lugar
        this._lugaresService.lugar$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lugar: Lugar) =>
            {
                // Update the selected lugar
                this.selectedLugar = lugar;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query =>

                    // Search
                    this._lugaresService.searchLugares(query),
                ),
            )
            .subscribe();

        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) =>
        {
            if ( !opened )
            {
                // Remove the selected lugar when drawer closed
                this.selectedLugar = null;

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
                    this.drawerMode = 'over';
                }
                else
                {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/'), // '/'
                ),
            )
            .subscribe(() =>
            {
                this.createLugar();
            });
    }


    filterByZona(zona: any): void
    {
        if(zona.value === 'all'){
            this.lugarDataSource.data = this.lugares;
            return;
        }
        this.lugarDataSource.data = this.lugares.filter((lugar) => lugar.zona === zona.value);
    }


    ngAfterViewInit(): void {
        this.lugarDataSource.paginator = this.paginator;
        this.lugarDataSource.sort = this.sort;
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

    /**
     * Create lugar
     */
    createLugar(): void
    {
        // Create the lugar
        this._lugaresService.createLugar().subscribe((newLugar) =>
        {
            // Go to the new lugar
            this._router.navigate(['./', newLugar.id], {relativeTo: this._activatedRoute});

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
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
