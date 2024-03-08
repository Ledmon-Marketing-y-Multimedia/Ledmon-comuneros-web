import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

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

getFileExtensionImage(attachment: File){
    const split = attachment.name?.split('.')
    if (split){
      const extension = split[split?.length - 1]
      return extension.toUpperCase();
    }
  }

}
