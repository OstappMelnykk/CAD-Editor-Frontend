import {Injectable} from '@angular/core';
import {GlobalVariablesService} from './global-variables.service';
import {WindowResizeService} from '../ui/window-resize.service';
import * as THREE from 'three';

@Injectable({
    providedIn: 'root'
})
export class CanvasResizeService {

    public canvasSize: ICanvasSize = {
        Width: null,
        Height: null
    }

    constructor(private globalVarsService: GlobalVariablesService,
                private windowResizeService: WindowResizeService )
    { }

    onCanvasResize(): void {

        const col3: number = this.windowResizeService.col3
        const row2: number = this.windowResizeService.row2

        this.canvasSize.Width = col3
        this.canvasSize.Height = row2

        const renderer = this.globalVarsService.get('renderer') as THREE.WebGLRenderer | null;
        const camera = this.globalVarsService.get('camera') as THREE.PerspectiveCamera | null ;

        if (renderer && camera && this.canvasSize.Width && this.canvasSize.Height){
            camera.aspect = this.canvasSize.Width / this.canvasSize.Height;
            camera.updateProjectionMatrix();
            renderer.setSize(this.canvasSize.Width, this.canvasSize.Height);
        }
    }
}

interface ICanvasSize{
    Width: number | null;
    Height: number | null;
}
