import {Injectable} from '@angular/core';
import {IGlobalVariables} from '../../interfaces/three-js/IGlobalVariables.interface';

@Injectable({
    providedIn: 'root'
})
export class GlobalVariablesService {

    private globals : IGlobalVariables = {
        canvas: null,
        scene: null,
        camera: null,
        renderer: null,
        orbitControls: null,
    };

    constructor() { }


    public get(key: keyof IGlobalVariables) {
        return this.globals[key];
    }

    public set(key: keyof IGlobalVariables, value: any): void {
        this.globals[key] = value;
    }
}
