import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { BehaviorSubject, catchError, concatMap, filter, from, Observable, of, switchMap, throwError } from 'rxjs';
import { User } from '../user/user.types';
import { environment } from 'environments/environment';

const LOGIN_CHECK_URL = environment.apiUrl + '/login/check';

export const authConfig : AuthConfig = {

    issuer: environment.authIssuer,
    clientId: 'comuneros-app', // The "Auth Code + PKCE" client
    responseType: 'code',
    requireHttps: environment.production,
    redirectUri: window.location.origin + '/',
    logoutUrl: window.location.origin + '/',
    silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
    scope: 'openid profile email', // Ask offline_access to support refresh token refreshes
    useSilentRefresh: true, // Needed for Code Flow to suggest using iframe-based refreshes
    sessionChecksEnabled: true,
    showDebugInformation: true, // Also requires enabling "Verbose" level in devtools
    clearHashAfterLogin: false, // https://github.com/manfredsteyer/angular-oauth2-oidc/issues/457#issuecomment-431807040,
    nonceStateSeparator : 'semicolon' // Real semicolon gets mangled by Duende ID Server's URI encoding
  };

@Injectable({providedIn: 'root'})
export class AuthService
{
    private _authenticated: boolean = false;
    private isDoneLoadingSubject$ = new BehaviorSubject<boolean>(false);
    public isDoneLoading$ = this.isDoneLoadingSubject$.asObservable();

    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _oauthService = inject(OAuthService);
    private _router = inject(Router);
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    constructor() {
        this._oauthService.configure(authConfig);
        this._oauthService.loadDiscoveryDocumentAndTryLogin();
        // This is tricky, as it might cause race conditions (where access_token is set in another
        // tab before everything is said and done there.
        // TODO: Improve this setup. See: https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/issues/2
        window.addEventListener('storage', (event) => {
        // The `key` is `null` if the event was caused by `.clear()`
        if (event.key !== 'access_token' && event.key !== null) {
            return;
        }

        // console.warn('Noticed changes to access_token (most likely from another tab), updating isAuthenticated');
        // this.isAuthenticatedSubject$.next(this._oauthService.hasValidAccessToken());

        if (!this._oauthService.hasValidAccessToken()) {
            this.navigateToLoginPage();
        }
        });

        this._oauthService.events
        .subscribe(_ => {
            // this.isAuthenticatedSubject$.next(this._oauthService.hasValidAccessToken());
        });
        // this.isAuthenticatedSubject$.next(this._oauthService.hasValidAccessToken());

        this._oauthService.events
        .pipe(filter(e => ['token_received'].includes(e.type)))
        .subscribe(e => this._oauthService.loadUserProfile());

        this._oauthService.events
        .pipe(filter(e => ['session_terminated', 'session_error'].includes(e.type)))
        .subscribe(e => this.navigateToLoginPage());

        this._oauthService.setupAutomaticSilentRefresh();

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any>
    {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any>
    {
        // Throw error, if the user is already logged in
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post('api/auth/sign-in', credentials).pipe(
            switchMap((response: any) =>
            {
                // Store the access token in the local storage
                this.accessToken = response.accessToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return a new observable with the response
                return of(response);
            }),
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Sign in using the token
        return this._httpClient.post('api/auth/sign-in-with-token', {
            accessToken: this.accessToken,
        }).pipe(
            catchError(() =>

                // Return false
                of(false),
            ),
            switchMap((response: any) =>
            {
                // Replace the access token with the new one if it's available on
                // the response object.
                //
                // This is an added optional step for better security. Once you sign
                // in using the token, you should generate a new one on the server
                // side and attach it to the response object. Then the following
                // piece of code can replace the token with the refreshed one.
                if ( response.accessToken )
                {
                    this.accessToken = response.accessToken;
                }

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return true
                return of(true);
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        this._oauthService.logOut();

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        // Check if the user is logged in
        if ( this._authenticated )
        {
            return of(true);
        }

        // If the access token exists and it didn't expire, sign in using it
        return this.userCheck();
    }

    public login(targetUrl?: string) {
        this._oauthService.initLoginFlow(targetUrl || this._router.url);
    }

    public runInitialLoginSequence(): Promise<void> {
        if (location.hash) {
        }

        // 0. LOAD CONFIG:
        // First we have to check to see how the IdServer is
        // currently configured:
        return this._oauthService.loadDiscoveryDocument()
          // 1. HASH LOGIN:
          // Try to log in via hash fragment after redirect back
          // from IdServer from initImplicitFlow:
          .then(() => this._oauthService.tryLogin())

          .then(() => {
            if (this._oauthService.hasValidAccessToken()) {
              return Promise.resolve();
            }

            // 2. SILENT LOGIN:
            // Try to log in via a refresh because then we can prevent
            // needing to redirect the user:
            return this._oauthService.silentRefresh()
              .then(() => Promise.resolve())
              .catch(result => {
                // Subset of situations from https://openid.net/specs/openid-connect-core-1_0.html#AuthError
                // Only the ones where it's reasonably sure that sending the
                // user to the IdServer will help.
                const errorResponsesRequiringUserInteraction = [
                  'interaction_required',
                  'login_required',
                  'account_selection_required',
                  'consent_required',
                ];

                if (result
                  && result.reason
                  && errorResponsesRequiringUserInteraction.indexOf(result.reason.error) >= 0) {

                  // 3. ASK FOR LOGIN:
                  // At this point we know for sure that we have to ask the
                  // user to log in, so we redirect them to the IdServer to
                  // enter credentials.
                  //
                  // Enable this to ALWAYS force a user to login.
                  // this.login();
                  //
                  // Instead, we'll now do this:
                  console.warn('User interaction is needed to log in, we will wait for the user to manually log in.');
                  return Promise.resolve();
                }

                // We can't handle the truth, just pass on the problem to the
                // next handler.
                return Promise.reject(result);
              });
          })

          .then(() => {
            this.isDoneLoadingSubject$.next(true);

            // Check for the strings 'undefined' and 'null' just to be sure. Our current
            // login(...) should never have this, but in case someone ever calls
            // initImplicitFlow(undefined | null) this could happen.
            if (this._oauthService.state && this._oauthService.state !== 'undefined' && this._oauthService.state !== 'null') {
              let stateUrl = this._oauthService.state;
              if (stateUrl.startsWith('/') === false) {
                stateUrl = decodeURIComponent(stateUrl);
              }
              this._router.navigateByUrl(stateUrl);
            }
          })
          .catch((result) => {this.isDoneLoadingSubject$.next(true); return Promise.reject(result)});
    }

    userCheck() : Observable<boolean>{
        return from(this.runInitialLoginSequence()).pipe(
            concatMap((stat: any) => {
                return this._httpClient.get<User>(LOGIN_CHECK_URL).pipe(
                    concatMap((response: any) => {
                            // Set the authenticated flag to true
                            this._authenticated = true;


                            const user: User = response;

                            // Store the user on the user service
                            this._userService.user = user;

                            // Return a new observable with the response
                            return of(true);
                        }
                    ),
                    catchError(() => {
                        return of(false)
                    }
                ),);
            })
        )
    }

    private navigateToLoginPage() {
        // TODO: Remember current URL
        this._router.navigateByUrl('/signed-in-redirect');
    }
}
