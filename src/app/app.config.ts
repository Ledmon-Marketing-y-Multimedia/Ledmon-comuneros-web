import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, LOCALE_ID, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, Router, provideRouter, withInMemoryScrolling, withPreloading, withViewTransitions } from '@angular/router';
import { provideFuse } from '@fuse';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { mockApiServices } from 'app/mock-api';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import * as Sentry from "@sentry/angular-ivy";
import { authAppInitializerFactory } from './core/auth/auth-app-initializer.factory';
import { AuthService } from './core/auth/auth.service';
import { provideTranslocoLocale } from '@ngneat/transloco-locale';
import { registerLocaleData } from '@angular/common';
import localeES from '@angular/common/locales/es';
const globalFormatConfig : any  = {
    date: {
      dateStyle: 'medium',
    }
  };

registerLocaleData(localeES, 'es')

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideOAuthClient(),
        provideAnimations(),
        provideRouter(appRoutes,
            withViewTransitions(),
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({scrollPositionRestoration: 'enabled'}),
        ),

        { provide: APP_INITIALIZER, useFactory: authAppInitializerFactory, deps: [AuthService], multi: true },


        // Material Date Adapter
        {
            provide : DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {provide: LOCALE_ID, useValue: 'es' },
        { provide: MatPaginatorIntl, useValue: getesPaginatorIntl() },
        {
            provide : MAT_DATE_FORMATS,
            useValue: {
                parse  : {
                    dateInput: 'D',
                },
                display: {
                    dateInput         : 'DDD',
                    monthYearLabel    : 'LLL yyyy',
                    dateA11yLabel     : 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        {
        provide: ErrorHandler,
            useValue: Sentry.createErrorHandler({
                showDialog: true,
            }),
        },
        {
            provide: Sentry.TraceService,
            deps: [Router],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => {},
            deps: [Sentry.TraceService],
            multi: true,
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs      : [
                    {
                        id   : 'en',
                        label: 'English',
                    },
                    {
                        id   : 'tr',
                        label: 'Turkish',
                    },
                ],
                defaultLang         : 'en',
                fallbackLang        : 'en',
                reRenderOnLangChange: true,
                prodMode            : true,
            },
            loader: TranslocoHttpLoader,
        }),
        provideTranslocoLocale({
            localeConfig: {
                global: globalFormatConfig,
              },
              langToLocaleMapping: {
                  en: 'en-US',
                  es: 'es-ES'
              }
        }),


        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide   : APP_INITIALIZER,
            useFactory: () =>
            {
                const translocoService = inject(TranslocoService);
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);

                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi     : true,
        },

        // Fuse
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay   : 0,
                services: mockApiServices,
            },
            fuse   : {
                layout : 'classy',
                scheme : 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme  : 'theme-default',
                themes : [
                    {
                        id  : 'theme-default',
                        name: 'Default',
                    },
                    {
                        id  : 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id  : 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id  : 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id  : 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id  : 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};



import { MatPaginatorIntl } from "@angular/material/paginator";




export function getesPaginatorIntl() {

    const rangeLabel = (page: number, pageSize: number, length: number) => {
        if (length == 0 || pageSize == 0) { return `0 de ${length}`; }

        length = Math.max(length, 0);

        const startIndex = page * pageSize;

        // If the start index exceeds the list length, do not try and fix the end index to the end.
        const endIndex = startIndex < length ?
            Math.min(startIndex + pageSize, length) :
            startIndex + pageSize;

        return `${startIndex + 1} - ${endIndex} de ${length}`;
        }
        const paginatorIntl = new MatPaginatorIntl();
        paginatorIntl.itemsPerPageLabel = 'Items por página:';
        paginatorIntl.nextPageLabel = 'Próxima página';
        paginatorIntl.previousPageLabel = 'Página anterior';
        paginatorIntl.firstPageLabel = 'Primeira página';
        paginatorIntl.lastPageLabel = 'Ultima página';
        paginatorIntl.getRangeLabel = rangeLabel;
        return paginatorIntl;
}
