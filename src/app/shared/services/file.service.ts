import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { concatMap } from 'rxjs';

const DOCUMENT_URL = environment.apiUrl + '/document';

@Injectable({
  providedIn: 'root'
})
export class FileService {


constructor(private _httpClient: HttpClient) { }

getFileUrlByPath(path: string){
    // const encodedPath = encodeURIComponent(path);
    // query params
    const params = new HttpParams().set('path', path);
    return this._httpClient.get<any>(DOCUMENT_URL, { params, responseType: 'text' as any});
}


getFileByPath(path: string){
    const params = new HttpParams().set('path', path);
    return this._httpClient.get<any>(DOCUMENT_URL, { params, responseType: 'text' as any}).pipe(
        concatMap((response: any) => {
            return fetch(response).then(res => res.blob());
    }));
};


getFileExtensionImage(attachment){
    const split = attachment.name?.split('.')
    if (split){
      const extension = split[split?.length - 1]
      return extension.toUpperCase();
    }
  }

}
