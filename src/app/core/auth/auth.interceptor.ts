import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService, OAuthStorage } from 'angular-oauth2-oidc';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthUtils } from './auth.utils';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
    const oauthService = inject(OAuthService);
    const authStorage = inject(OAuthStorage);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.

    if ( authStorage.getItem("access_token") && !AuthUtils.isTokenExpired(authStorage.getItem("access_token")) )
    {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authStorage.getItem("access_token"))
        });
    }


    // Response
    return next(newReq).pipe(
        catchError((error) =>
        {
            // Catch "401 Unauthorized" responses
            if ( error instanceof HttpErrorResponse && error.status === 401 )
                {
                    if(authStorage.getItem("access_token")){
                        oauthService.logOut();
                    }

                    if((authStorage as any).length == 0){
                        location.reload();
                    }
                }

            return throwError(error);
        }),
    );
};
