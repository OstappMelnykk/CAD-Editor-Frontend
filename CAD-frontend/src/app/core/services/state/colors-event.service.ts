import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ICameraPosition} from '../../interfaces/three-js/ICameraPosition.interface';

@Injectable({
    providedIn: 'root'
})
export class ColorsEventService {


    initial_defaultMeshColor: string = '#fff';
    initial_hoverMeshColor: string = '#fff';
    initial_activeMeshColor: string = '#fff';
    initial_wireframeColor: string = '#fff';
    initial_defaultSphereColor: string = '#fff';
    initial_draggableSphereColor: string = '#fff';
    initial_meshOpacity: number = 0.1;

    defaultMeshColorEvent = new BehaviorSubject<string>(this.initial_defaultMeshColor);
    hoverMeshColorEvent = new BehaviorSubject<string>(this.initial_hoverMeshColor);
    activeMeshColorEvent = new BehaviorSubject<string>(this.initial_activeMeshColor);
    wireframeColorEvent = new BehaviorSubject<string>(this.initial_wireframeColor);
    defaultSphereColorEvent = new BehaviorSubject<string>(this.initial_defaultSphereColor);
    draggableSphereColorEvent = new BehaviorSubject<string>(this.initial_draggableSphereColor);
    meshOpacityEvent = new BehaviorSubject<number>(this.initial_meshOpacity);

    defaultMeshColorEvent$ = this.defaultMeshColorEvent.asObservable();
    hoverMeshColorEvent$ = this.hoverMeshColorEvent.asObservable();
    activeMeshColorEvent$ = this.activeMeshColorEvent.asObservable();
    wireframeColorEvent$ = this.wireframeColorEvent.asObservable();
    defaultSphereColorEvent$ = this.defaultSphereColorEvent.asObservable();
    draggableSphereColorEvent$ = this.draggableSphereColorEvent.asObservable();
    meshOpacityEvent$ = this.meshOpacityEvent.asObservable();


    ChangeDefaultMeshColor(defaultMeshColor: string): void {this.defaultMeshColorEvent.next(defaultMeshColor);}
    ChangeHoverMeshColor(hoverMeshColor: string): void {this.hoverMeshColorEvent.next(hoverMeshColor);}
    ChangeActiveMeshColor(activeMeshColor: string): void {this.activeMeshColorEvent.next(activeMeshColor);}
    ChangeWireframeColor(wireframeColor: string): void {this.wireframeColorEvent.next(wireframeColor);}
    ChangeDefaultSphereColor(defaultSphereColor: string): void {this.defaultSphereColorEvent.next(defaultSphereColor);}
    ChangeDraggableSphereColor(draggableSphereColor: string): void {this.draggableSphereColorEvent.next(draggableSphereColor);}
    ChangeMeshOpacity(meshOpacity: number): void {this.meshOpacityEvent.next(meshOpacity);}

    constructor() {
    }
}
