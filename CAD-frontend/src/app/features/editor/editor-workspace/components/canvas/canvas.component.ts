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
import {IMeshColors} from '../../../../../core/threejsMeshes/interfaces/IMeshColors.interface';
import {
    SuperGeometryMeshOptions
} from '../../../../../core/threejsMeshes/interfaces/ISuperGeometryMeshOptions.interface';
import {ApiService} from '../../../../../core/services/api/api.service';
import {IDivisionRequest} from '../../../../../core/models/DTOs/IDivisionRequest.interface';
import {DivisionEventService} from '../../../../../core/services/state/division-event.service';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    private objects: THREE.Object3D[] = []; // Масив для зберігання створених об'єктів.

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private pickablesObjects: THREE.Object3D[] = [];
    private intersects!: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[];

    constructor(private globalVariablesService: GlobalVariablesService,
                private initService: InitService,
                private canvasResizeService: CanvasResizeService,
                private cameraEventService: CameraEventService,
                private apiService: ApiService,
                private divisionEvent: DivisionEventService) {
    }

    ngOnInit() {
        /*
        canvas: HTMLCanvasElement | null,
        scene: THREE.Scene | null,
        camera: THREE.PerspectiveCamera | null,
        renderer: THREE.WebGLRenderer | null,
        orbitControls: OrbitControls | null
        */

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



        const dir = new THREE.Vector3(-1, 0, 0).normalize(); // Напрямок (приклад: одиничний вектор вздовж осі X)
        const origin = new THREE.Vector3(0, 0, 0); // Початкова точка (0, 0, 0)
        const length = 0.5; // Довжина стрілки
        const color = 0xFFDF54
        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, color);



        (this.globalVariablesService.get('scene')! as THREE.Scene).add(arrowHelper);


        const renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        const camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera;

        renderer.domElement.addEventListener('click', (event) => {
            if (!event.ctrlKey)
                return;

            this.setMouse(event)
            this.raycaster.setFromCamera(this.mouse, camera);
            this.intersects = this.raycaster.intersectObjects(this.pickablesObjects, false);

            if(this.intersects.length === 0)
                this.createMesh()


        });
    }



    setMouse(event: MouseEvent){
        const renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / this.canvasResizeService.canvasSize.Width!) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / this.canvasResizeService.canvasSize.Height!) * 2 + 1;
        this.mouse.set(mouseX, mouseY);
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

    createMesh(){

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
                    console.log('Дані зібрані з усіх запитів:', apiData);

                    this.divisionEvent.DivisionOccurs(apiData);

                    const superGeometryMesh = new SuperGeometryMesh(this.apiService);
                    superGeometryMesh.createMesh(
                        apiData,
                        {
                            colors: {
                                defaultColor: new THREE.Color('#5a8be2'),
                                hoverColor: new THREE.Color('rgba(255,4,4,0.7)'),
                                activeColor: new THREE.Color('rgba(0,89,255,0.61)'),
                                linesegmentsDefaultColor: new THREE.Color(0xbfc2c7),
                                sphereDefaultColor: new THREE.Color(0xbfc2c7),
                                sphereDraggableColor: new THREE.Color('rgba(255,4,4)')
                            } as IMeshColors,

                            opacity: 0.2,
                            wireframe: false,
                            depthWrite: false,
                            depthTest: true,
                        } as SuperGeometryMeshOptions
                    )

                    const position = new THREE.Vector3();
                    this.raycaster.ray.at(5, position);
                    superGeometryMesh.position.copy(position);
                    this.objects.push(superGeometryMesh);
                    this.pickablesObjects.push(superGeometryMesh);

                    let scene = this.globalVariablesService.get('scene') as THREE.Scene;
                    scene.add(superGeometryMesh);


                });
            },
            error: (err) => {
                console.error('Помилка під час виконання Divide:', err);
            }
        });
    }
}
