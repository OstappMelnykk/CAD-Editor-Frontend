import { Injectable } from '@angular/core';
import {IAPIData} from '../../interfaces/api/IAPIData.interface';
import {BehaviorSubject} from 'rxjs';
import {ICameraPosition} from '../../interfaces/three-js/ICameraPosition.interface';

@Injectable({
  providedIn: 'root'
})
export class CameraEventService {

    private initialCameraPosition: ICameraPosition = { x: 0, y: 0, z: 10 }

    private cameraEvent = new BehaviorSubject<ICameraPosition>(this.initialCameraPosition)
    cameraEvent$ = this.cameraEvent.asObservable();

    CameraChangePosition(cameraPosition: ICameraPosition): void {
        this.cameraEvent.next(cameraPosition);
    }
}
