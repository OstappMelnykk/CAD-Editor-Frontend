import {Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {IPoint} from '../../interfaces/api/IPoint.interface';
import {IPairOfIndices} from '../../interfaces/api/IPairOfIndices.interface';
import {IPolygon} from '../../interfaces/api/IPolygon.interface';
import {IDivisionResponse} from '../../models/DTOs/IDivisionResponse.interface';
import {IDivisionRequest} from '../../models/DTOs/IDivisionRequest.interface';
import {Observable} from 'rxjs';



@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private apiUrl = `${environment.apiBaseUrl}`;

    constructor(private http: HttpClient) {}

    Divide(requestBody: IDivisionRequest): Observable<IDivisionResponse> {
        return this.http.post<IDivisionResponse>(this.apiUrl + '/Devide', requestBody);
    }

    Points(): Observable<IPoint[]>{
        return this.http.get<IPoint[]>(this.apiUrl + '/GetComplexPoints')
    }

    NegativeFace_X_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetNegativeFacePoints_X_as(GlobalIDs-1)')}
    NegativeFace_Y_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetNegativeFacePoints_Y_as(GlobalIDs-1)')}
    NegativeFace_Z_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetNegativeFacePoints_Z_as(GlobalIDs-1)')}
    PositiveFace_X_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetPositiveFacePoints_X_as(GlobalIDs-1)')}
    PositiveFace_Y_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetPositiveFacePoints_Y_as(GlobalIDs-1)')}
    PositiveFace_Z_Points(): Observable<number[]>{return this.http.get<number[]>(this.apiUrl + '/GetPositiveFacePoints_Z_as(GlobalIDs-1)')}

    PairsOfIndices(): Observable<IPairOfIndices[]>{
        return this.http.get<IPairOfIndices[]>(this.apiUrl + '/GetPairsOfIndices')
    }

    Polygons(): Observable<IPolygon[]>{
        return this.http.get<IPolygon[]>(this.apiUrl + '/GetPolygons')
    }

    DefaultPoints(): Observable<IPoint[]>{
        return this.http.get<IPoint[]>(this.apiUrl + '/Get_20_DefaultComplexPoints')
    }
}
