import {Injectable} from '@angular/core';
import {IAPIData} from '../../interfaces/api/IAPIData.interface';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DivisionEventService {

    private APIData: IAPIData = {
        points: [],
        pairsOfIndices:[],
        polygons:[],
        defaultComplexPoints:[],
    }

    private divisionEvent = new BehaviorSubject<IAPIData>(this.APIData)
    divisionEvent$ = this.divisionEvent.asObservable();

    DivisionOccurs(apiData: IAPIData): void {
        this.divisionEvent.next(apiData);
    }
}
