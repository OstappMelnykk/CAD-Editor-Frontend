import {Injectable} from '@angular/core';
import {Signal} from 'signals';
import {IAPIData} from '../../interfaces/api/IAPIData.interface';
import {BehaviorSubject} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class ViewButtonEventService {

    private viewButtonEvent = new BehaviorSubject<number>(5)
    viewButtonEvent$ = this.viewButtonEvent.asObservable();

    viewButtonChanges(viewButtonNumber: number): void {
        this.viewButtonEvent.next(viewButtonNumber);
    }

}
