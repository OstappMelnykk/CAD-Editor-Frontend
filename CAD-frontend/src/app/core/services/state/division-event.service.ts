import {Injectable} from '@angular/core';
import {IAPIData} from '../../interfaces/api/IAPIData.interface';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DivisionEventService {

    private initialAPIData: IAPIData = {
        points: [],
        pairsOfIndices:[],
        polygons:[],
    }

    private divisionEvent = new BehaviorSubject<IAPIData>(this.initialAPIData)
    divisionEvent$ = this.divisionEvent.asObservable();

    DivisionOccurs(apiData: IAPIData): void {
        this.divisionEvent.next(apiData);
    }
}
