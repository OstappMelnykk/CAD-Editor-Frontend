import {Injectable} from '@angular/core';
import {IAPIData} from '../../interfaces/api/IAPIData.interface';
import {BehaviorSubject} from 'rxjs';
import {IDivisionConfig} from '../../interfaces/api/IDivisionConfig';

@Injectable({
    providedIn: 'root'
})
export class DivisionEventService {

    private divisionConfig: IDivisionConfig = {
        x: 0,
        y: 0,
        z: 0,
    }
    private divisionEvent = new BehaviorSubject<IDivisionConfig>(this.divisionConfig)
    divisionEvent$ = this.divisionEvent.asObservable();
    DivisionOccurs(divisionConfig: IDivisionConfig): void {
        this.divisionEvent.next(divisionConfig);
    }
}
