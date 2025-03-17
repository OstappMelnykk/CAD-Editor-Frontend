import {Component, OnInit} from '@angular/core';
import {GlobalVariablesService} from '../../../../../core/services/three-js/global-variables.service';
import {InitService} from '../../../../../core/services/three-js/init.service';
import {CanvasResizeService} from '../../../../../core/services/three-js/canvas-resize.service';
import {CameraEventService} from '../../../../../core/services/state/camera-event.service';
import {ICameraPosition} from '../../../../../core/interfaces/three-js/ICameraPosition.interface';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {SuperGeometryMesh} from '../../../../../core/threejsMeshes/SuperGeometryMesh';
import {forkJoin} from 'rxjs';
import {IAPIData} from '../../../../../core/interfaces/api/IAPIData.interface';
import {ApiService} from '../../../../../core/services/api/api.service';
import {IDivisionRequest} from '../../../../../core/models/DTOs/IDivisionRequest.interface';
import {DivisionEventService} from '../../../../../core/services/state/division-event.service';
import {meshOptions} from '../../../../../core/threejsMeshes/meshOptions';
import {clickToCreate} from './Listeners/clickToCreate';
import {clickToChoose} from './Listeners/clickToChoose';
import {meshHover} from './Listeners/meshHover';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    private objects: THREE.Object3D[] = [];

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private pickablesObjects: THREE.Object3D[] = [];

    hoveredObject: SuperGeometryMesh | null = null;
    activeMesh: SuperGeometryMesh | null = null;

    constructor(private globalVariablesService: GlobalVariablesService,
                private initService: InitService,
                private canvasResizeService: CanvasResizeService,
                private cameraEventService: CameraEventService,
                private apiService: ApiService,
                private divisionEvent: DivisionEventService) {}

    ngOnInit() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement

        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }

        this.initService.init(canvas);
        this.resizeListener()
        this.subscriptionHandler()

        const renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        const camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera;


        renderer.domElement.addEventListener('click',(event: MouseEvent) => {
            clickToCreate(event, {
                setMouse: this.setMouse.bind(this),
                raycaster: this.raycaster,
                mouse: this.mouse,
                camera: camera,
                pickablesObjects: this.pickablesObjects,
                createMesh: this.createMesh.bind(this),
            });
        });

        renderer.domElement.addEventListener('click',(event: MouseEvent) => {
            clickToChoose.call(this, event, {
                setMouse: this.setMouse.bind(this),
                raycaster: this.raycaster,
                mouse: this.mouse,
                camera: camera,
                pickablesObjects: this.pickablesObjects,
            });
        });

        renderer.domElement.addEventListener('mousemove', (event: MouseEvent) => {
            meshHover.call(this, event, {
                setMouse: this.setMouse.bind(this),
                raycaster: this.raycaster,
                mouse: this.mouse,
                camera: camera,
                pickablesObjects: this.pickablesObjects,
            });
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
        const renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / this.canvasResizeService.canvasSize.Width!) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / this.canvasResizeService.canvasSize.Height!) * 2 + 1;
        this.mouse.set(mouseX, mouseY);
    }

    onCameraPositionChanged(cameraPosition: ICameraPosition): void
    {
        const _camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera | null;
        const _orbitControls = this.globalVariablesService.get('orbitControls') as OrbitControls | null;

        _camera?.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        _camera?.lookAt(0, 0, 0);
        _orbitControls?.target.set(0, 0, 0);
        _orbitControls?.update();
    }


    onDivisionOcures(apiData: IAPIData)
    {
        if(this.activeMesh === null){
            console.log("No active mesh")
            return;
        }


        let scene = this.globalVariablesService.get('scene') as THREE.Scene;
        const activeMeshPosition: THREE.Vector3 = this.activeMesh.position
        scene.remove(this.activeMesh)
        this.activeMesh.dispose()
        this.activeMesh = null

        const index1 = this.pickablesObjects.findIndex(obj => obj.position.equals(activeMeshPosition));
        if (index1 > -1) {
            this.pickablesObjects.splice(index1, 1);
        }

        const superGeometryMesh = new SuperGeometryMesh(this.apiService);
        superGeometryMesh.createMesh(apiData, meshOptions)

        superGeometryMesh.position.copy(activeMeshPosition);

        this.objects.push(superGeometryMesh);
        this.pickablesObjects.push(superGeometryMesh);

        scene.add(superGeometryMesh);
    }

    createMesh(): void
    {
        const divisionRequest = {
            x: 1,
            y: 1,
            z: 1,
        } as IDivisionRequest

        this.apiService.Divide(divisionRequest).subscribe({
            next: () => {
                forkJoin({
                    points: this.apiService.Points(),
                    pairsOfIndices: this.apiService.PairsOfIndices(),
                    polygons: this.apiService.Polygons()
                }).subscribe((apiData: IAPIData) => {

                    const superGeometryMesh = new SuperGeometryMesh(this.apiService);
                    superGeometryMesh.createMesh(apiData, meshOptions)

                    const position = new THREE.Vector3();
                    this.raycaster.ray.at(10, position);
                    superGeometryMesh.position.copy(position);

                    this.objects.push(superGeometryMesh);
                    this.pickablesObjects.push(superGeometryMesh);

                    let scene = this.globalVariablesService.get('scene') as THREE.Scene;
                    scene.add(superGeometryMesh);
                });
            },
            error: (err) => {
                console.error('Error while execution Divide:', err);
            }
        });
    }
}
