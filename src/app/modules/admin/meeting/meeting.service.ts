import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Meeting, MeetingAttendance } from 'app/modules/admin/meeting/meeting.types';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';

const MEETING_URL = environment.apiUrl + '/meeting';
const ATTENDANCE_URL = environment.apiUrl + '/attendance';


@Injectable({providedIn: 'root'})
export class MeetingService
{
    // Private
    private _meeting: BehaviorSubject<Meeting | null> = new BehaviorSubject(null);
    private _meetings: BehaviorSubject<Meeting[] | null> = new BehaviorSubject(null);
    private _scanning: BehaviorSubject<Meeting | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for meeting
     */
    get meeting$(): Observable<Meeting>
    {
        return this._meeting.asObservable();
    }

    /**
     * Getter for meeting
     */
    get meetings$(): Observable<Meeting[]>
    {
        return this._meetings.asObservable();
    }

    /**
     * Getter for scanning
     */
    get scanning$(): Observable<Meeting>
    {
        return this._scanning.asObservable();
    }

    /**
     * Setter for scanning
     */
    set scanning(value: Meeting)
    {
        this._scanning.next(value);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    /**
     * Get meeting
     */
    getMeetings(): Observable<Meeting[]>
    {
        return this._httpClient.get<Meeting[]>(MEETING_URL + "/search/" + "marcon").pipe(
            tap((response) =>
            {
                this._meetings.next(response);
            }),
        );
    }

    /**
     * Search meeting with given query
     *
     * @param query
     */
    searchMeeting(query: string): Observable<Meeting[] | null>
    {
        return this._httpClient.get<Meeting[] | null>(MEETING_URL + "/search/" + "marcon", {params: {query}});
    }

    /**
     * Get meeting by id
     */
    getMeetingById(id: string): Observable<Meeting>
    {
        return this._meetings.pipe(
            take(1),
            map((meetings) =>
            {
                // Find the meeting
                const meeting = meetings.find(item => item.id === id) || null;

                // Update the meeting
                this._meeting.next(meeting);

                // Return the meeting
                return meeting;
            }),
            switchMap((meeting) =>
            {
                if ( !meeting )
                {
                    return throwError('Could not found meeting with id of ' + id + '!');
                }

                return of(meeting);
            }),
        );
    }

    /**
     * Create meeting
     *
     * @param type
     */
    createMeeting(): Observable<Meeting>
    {
        return this.meetings$.pipe(
            take(1),
            switchMap(meetings => this._httpClient.post<Meeting>(MEETING_URL, {name:"", attendance: [], comunidad: {id: "a09b25f2-897b-4e33-bac5-d5e34f7245ce"}}).pipe(
                map((newMeeting) =>
                {
                    // Update the meeting with the new meeting
                    this._meetings.next([newMeeting, ...meetings]);

                    // Return the new meeting
                    return newMeeting;
                }),
            )),
        );
    }

    /**
     * Update meeting
     *
     * @param id
     * @param meeting
     */
    updateMeeting(id: string, meeting: Meeting): Observable<Meeting>
    {
        return this.meetings$
            .pipe(
                take(1),
                switchMap(meetings => this._httpClient.patch<Meeting>(MEETING_URL + "/" + id,
                    meeting
                ).pipe(
                    map((updatedMeeting) =>
                    {
                        // Find the index of the updated meeting
                        const index = meetings.findIndex(item => item.id === id);

                        // Update the meeting
                        meeting[index] = updatedMeeting;

                        // Update the meeting
                        this._meeting.next(meeting);

                        // Return the updated meeting
                        return updatedMeeting;
                    }),
                    switchMap(updatedMeeting => this.meeting$.pipe(
                        take(1),
                        filter(item => item && item.id === id),
                        tap(() =>
                        {
                            // Update the meeting if it's selected
                            this._meeting.next(updatedMeeting);

                            // Return the updated meeting
                            return updatedMeeting;
                        }),
                    )),
                )),
            );
    }


    /**
     * Announcement attendance
     *
     * @param meetingId
     * @param lugarId
     */
    getAnnouncementAttendance(meetingId: string, lugarId: string): Observable<MeetingAttendance[]>
    {
        return this._httpClient.get<MeetingAttendance[]>(ATTENDANCE_URL + "/" + meetingId + "/lugar/" + lugarId);
    }


    /**
     *  Search attendance by comunero name
     *
     * @param meetingId
     * @param name
     */
    getAttendancesByName(meetingId: string, name: string): Observable<MeetingAttendance[]>
    {
        return this._httpClient.get<MeetingAttendance[]>(ATTENDANCE_URL + "/" + meetingId + "/search", {params: {name}});
    }


    /**
     * Register attendance
     *
     * @param meetingId
     * @param attendance
     */
    registerAttendance(attendance: MeetingAttendance): Observable<any>
    {
        return this._httpClient.patch<any>(ATTENDANCE_URL + "/register", attendance);
    }

    /**
     * Delete the meeting
     *
     * @param id
     */
    deleteMeeting(id: string): Observable<boolean>
    {
        return this.meetings$.pipe(
            take(1),
            switchMap(meetings => this._httpClient.delete(MEETING_URL + "/" + id).pipe(
                map((isDeleted: boolean) =>
                {
                    // Find the index of the deleted meeting
                    const index = meetings.findIndex(item => item.id === id);

                    // Delete the meeting
                    meetings.splice(index, 1);

                    // Update the meeting
                    this._meetings.next(meetings);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }
}
