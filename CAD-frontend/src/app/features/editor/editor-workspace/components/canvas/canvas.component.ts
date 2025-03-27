import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { forkJoin } from 'rxjs';

// Services
import { GlobalVariablesService } from '../../../../../core/services/three-js/global-variables.service';
import { InitService } from '../../../../../core/services/three-js/init.service';
import { CanvasResizeService } from '../../../../../core/services/three-js/canvas-resize.service';
import { CameraEventService } from '../../../../../core/services/state/camera-event.service';
import { ApiService } from '../../../../../core/services/api/api.service';
import { DivisionEventService } from '../../../../../core/services/state/division-event.service';

// Interfaces
import { ICameraPosition } from '../../../../../core/interfaces/three-js/ICameraPosition.interface';
import { IAPIData } from '../../../../../core/interfaces/api/IAPIData.interface';
import { IDivisionRequest } from '../../../../../core/models/DTOs/IDivisionRequest.interface';

// Classes & Constants
import { SuperGeometryMesh } from '../../../../../core/threejsMeshes/SuperGeometryMesh';

// Event Listeners
import { clickToCreate } from './Listeners/clickToCreate';
import { mousedownToChoose } from './Listeners/mousedownToChoose';
import { meshHover } from './Listeners/meshHover';
import {DEFAULT_POINTS} from '../../../../../core/threejsMeshes/DefaultPoints';
import {IPoint} from '../../../../../core/interfaces/api/IPoint.interface';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    activeObject: SuperGeometryMesh | null = null;
    hoveredObject: THREE.Object3D | null = null;
    hoveredPoint: THREE.Vector3 | null = null;

    pickableObjects: THREE.Object3D[] = [];
    draggableObjects: THREE.Object3D[] = [];

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvas!: HTMLCanvasElement;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    renderer!: THREE.WebGLRenderer;
    orbitControls!: OrbitControls;


    constructor(
        private globalVariablesService: GlobalVariablesService,
        private initService: InitService,
        private canvasResizeService: CanvasResizeService,
        private cameraEventService: CameraEventService,
        private apiService: ApiService,
        private divisionEvent: DivisionEventService
    ) {}

    ngOnInit()
    {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement

        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }

        this.initService.init(canvas);
        this.resizeListener()
        this.subscriptionHandler()

        this.canvas = this.globalVariablesService.get('canvas') as HTMLCanvasElement;
        this.scene = this.globalVariablesService.get('scene') as THREE.Scene;
        this.camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera;
        this.renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        this.orbitControls = this.globalVariablesService.get('orbitControls') as OrbitControls;


        this.renderer.domElement.addEventListener('click',(event: MouseEvent) => {
            clickToCreate.call(this, event, {
                setMouse: this.setMouse.bind(this),
                createMesh: this.createMesh.bind(this),
            });
        });

        this.renderer.domElement.addEventListener('mousedown',(event: MouseEvent) => {
            mousedownToChoose.call(this, event, { setMouse: this.setMouse.bind(this) });
        });

        this.renderer.domElement.addEventListener('mousemove', (event: MouseEvent) => {
            this.hoveredPoint = meshHover.call(this, event, { setMouse: this.setMouse.bind(this) });
        });

        this.apiService.DefaultPoints().subscribe({
            next: (defaultPoints) => {
                DEFAULT_POINTS.push(...defaultPoints as IPoint[])
                DEFAULT_POINTS.sort((a, b) => a.localIds[0] - b.localIds[0]);

                console.log(DEFAULT_POINTS)
            },
            error: (err) => console.error('Error while fetching DefaultPoints:', err),
        });
    }


    async onDivisionOcures(apiData: IAPIData)
    {
        if (this.activeObject === null) {
            console.log("No active mesh");
            return;
        }

        const activeMeshPosition: THREE.Vector3 = this.activeObject.position;
        const activeMeshDefaultPoints = (this.activeObject as SuperGeometryMesh).defaultPoints

        if (this.activeObject && this.activeObject.parent) {
            this.scene.remove(this.activeObject);
            this.activeObject.dispose();
        }
        this.activeObject = null;

        const index1 = this.pickableObjects.findIndex(obj => obj.position.equals(activeMeshPosition));
        if (index1 > -1) this.pickableObjects.splice(index1, 1);


        const superGeometryMesh = this.createAndAddMesh(apiData, activeMeshPosition);
    }


    private createAndAddMesh(apiData: IAPIData, position: THREE.Vector3): SuperGeometryMesh
    {
        const superGeometryMesh = new SuperGeometryMesh(this.apiService, this.globalVariablesService);
        superGeometryMesh.createMesh(apiData);

        superGeometryMesh.position.copy(position);

        this.pickableObjects.push(superGeometryMesh);
        this.draggableObjects.push(superGeometryMesh);

        this.scene.add(superGeometryMesh);
        return superGeometryMesh
    }


    createMesh(): void
    {
        const divisionRequest = { x: 1, y: 1, z: 1 } as IDivisionRequest

        this.apiService.Divide(divisionRequest).subscribe({
            next: () => {
                forkJoin({
                    points: this.apiService.Points(),
                    pairsOfIndices: this.apiService.PairsOfIndices(),
                    polygons: this.apiService.Polygons(),
                    defaultComplexPoints: this.apiService.DefaultPoints(),
                }).subscribe({
                    next: (apiData: IAPIData) => {
                        const position = new THREE.Vector3();
                        this.raycaster.ray.at(10, position);
                        this.createAndAddMesh(apiData, position)
                    },
                    error: (err) => console.error('Error while fetching mesh data:', err),
                });
            },
            error: (err) => {console.error('Error while execution Divide:', err);}
        });
    }


    subscriptionHandler(){
        this.cameraEventService.cameraEvent$.subscribe((cameraPosition: ICameraPosition) => {
            this.onCameraPositionChanged(cameraPosition);
        })

        this.divisionEvent.divisionEvent$.subscribe((apiData) => {
            this.onDivisionOcures(apiData);
        })
    }

    resizeListener(){
        window.addEventListener('resize', () => this.canvasResizeService.onCanvasResize());
        window.dispatchEvent(new Event('resize'));
    }

    setMouse(event: MouseEvent): void{
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / this.canvasResizeService.canvasSize.Width!) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / this.canvasResizeService.canvasSize.Height!) * 2 + 1;
        this.mouse.set(mouseX, mouseY);
    }

    onCameraPositionChanged(cameraPosition: ICameraPosition): void
    {
        this.camera?.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        this.camera?.lookAt(0, 0, 0);
        this.orbitControls?.target.set(0, 0, 0);
        this.orbitControls?.update();
    }
}
