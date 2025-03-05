import {Component, OnInit} from '@angular/core';
import {GlobalVariablesService} from '../../../../../core/services/three-js/global-variables.service';
import {InitService} from '../../../../../core/services/three-js/init.service';
import {CanvasResizeService} from '../../../../../core/services/three-js/canvas-resize.service';
import {CameraEventService} from '../../../../../core/services/state/camera-event.service';
import {ICameraPosition} from '../../../../../core/interfaces/three-js/ICameraPosition.interface';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
    selector: 'app-canvas',
    imports: [],
    templateUrl: './canvas.component.html',
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    constructor(private globalVariablesService: GlobalVariablesService,
                private initService: InitService,
                private canvasResizeService: CanvasResizeService,
                private cameraEventService: CameraEventService) {
    }

    ngOnInit() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement

        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }

        this.initService.init(canvas);

        window.addEventListener('resize', () => this.canvasResizeService.onCanvasResize());
        window.dispatchEvent(new Event('resize'));

        this.cameraEventService.cameraEvent$.subscribe((cameraPosition: ICameraPosition) => {
            this.onCameraPositionChanged(cameraPosition);
        })
    }

    onCameraPositionChanged(cameraPosition: ICameraPosition): void {
        console.log("from three", cameraPosition);

        console.log('sdfsdf')
        const _camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera | null;
        const _orbitControls = this.globalVariablesService.get('orbitControls') as OrbitControls | null;

        _camera?.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        _camera?.lookAt(0, 0, 0);
        _orbitControls?.target.set(0, 0, 0);
        _orbitControls?.update();
    }
}
