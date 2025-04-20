import {Component, inject, OnInit} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {DragControls} from 'three/examples/jsm/controls/DragControls.js';
import {GlobalVariablesService} from '../../../../../core/services/three-js/global-variables.service';
import {InitService} from '../../../../../core/services/three-js/init.service';
import {CanvasResizeService} from '../../../../../core/services/three-js/canvas-resize.service';
import {CameraEventService} from '../../../../../core/services/state/camera-event.service';
import {ApiService} from '../../../../../core/services/api/api.service';
import {DivisionEventService} from '../../../../../core/services/state/division-event.service';
import {SuperGeometryMesh} from '../../../../../core/threejsMeshes/SuperGeometryMesh';
import {clickToCreate} from './Listeners/clickToCreate';
import {mousedownToChoose} from './Listeners/mousedownToChoose';
import {meshHover} from './Listeners/meshHover';
import {DEFAULT_POINTS} from '../../../../../core/threejsMeshes/DefaultPoints';
import {IPoint} from '../../../../../core/interfaces/api/IPoint.interface';
import {ICameraPosition} from '../../../../../core/interfaces/three-js/ICameraPosition.interface';
import {IDivisionConfig} from '../../../../../core/interfaces/api/IDivisionConfig';
import {IDivisionRequest} from '../../../../../core/models/DTOs/IDivisionRequest.interface';
import {ObjectManager} from './ObjectManager';
import {meshOptions} from '../../../../../core/threejsMeshes/meshOptions';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    standalone: true,
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    globalVariablesService = inject(GlobalVariablesService)
    initService = inject(InitService);
    canvasResizeService = inject(CanvasResizeService);
    cameraEventService = inject(CameraEventService);
    apiService = inject(ApiService);
    divisionEvent = inject(DivisionEventService);


    canvas!: HTMLCanvasElement;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    renderer!: THREE.WebGLRenderer;
    orbitControls!: OrbitControls;
    dragControls!: DragControls;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    activeObject: SuperGeometryMesh | null = null;
    hoveredObject: THREE.Object3D | null = null;
    hoveredPoint: THREE.Vector3 | null = null;
    PointVisualisation: THREE.Object3D = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 32), new THREE.MeshBasicMaterial({color: new THREE.Color('#00ff00')}));
    isRemoved: boolean = true;

    /*pickableObjects: THREE.Object3D[] = [];
    draggableObjects: THREE.Group[] = [];
    groups: THREE.Group[] = [];
    draggableGroupIndex: number = -1;*/

    objectManager!: ObjectManager;



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
        this.initializeGlobalVariables();

        this.objectManager = new ObjectManager(this.scene);


        this.renderer.domElement.addEventListener('click', this.handleCanvasClick.bind(this));
        this.renderer.domElement.addEventListener('mousedown', this.handleCanvasMousedown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.handleCanvasMousemove.bind(this));

        this.apiService.DefaultPoints().subscribe({
            next: (defaultPoints) => {
                DEFAULT_POINTS.push(...defaultPoints as IPoint[])
                DEFAULT_POINTS.sort((a, b) => a.localIds[0] - b.localIds[0]);
                console.log("sd")
            },
            error: (err) => console.error('Error while fetching DefaultPoints:', err),
        });



        this.dragControls = new DragControls(this.objectManager.getGroups(), this.camera, this.renderer.domElement);
        this.dragControls.transformGroup = true;
        this.dragControls.raycaster.params.Line.threshold = 0.01;


        this.dragControls.addEventListener('dragstart', (event) => {this.handleDragStart(event);});
        this.dragControls.addEventListener('drag', (event) => {this.handleDrag(event);});
        this.dragControls.addEventListener('dragend', (event) => {this.handleDragEnd(event);});

    }

    subscriptionHandler(){
        this.cameraEventService.cameraEvent$.subscribe((cameraPosition: ICameraPosition) => {
            this.onCameraPositionChanged(cameraPosition);
        })

        this.divisionEvent.divisionEvent$.subscribe((divisionConfig) => {
            this.onDivisionOcures(divisionConfig);
        })
    }


    private handleDragStart(event: { object: THREE.Object3D } & THREE.Event<"dragstart", DragControls>): void {
        this.orbitControls.enabled = false;
        const draggedObject = event.object as THREE.Group;

        if (draggedObject.children.length === 1) {
            let draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            if (Array.isArray(draggedObjectMesh.material))
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = 0;
            }

        }
    }
    private handleDrag(event: { object: THREE.Object3D } & THREE.Event<"drag", DragControls>): void {
        /*const draggedObject = event.object as THREE.Group;

        if (draggedObject.children.length === 1) {
            let draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            this.draggableGroupIndex = this.pickableObjects.findIndex(obj => obj.uuid === draggedObjectMesh.uuid);

            if (this.draggableGroupIndex > -1) {
                this.pickableObjects.splice(this.draggableGroupIndex, 1);
            }

        }*/
        const draggedObject = event.object as THREE.Group;

        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            // Видаляємо сітку тимчасово зі списку pickable через ObjectManager
            if (this.objectManager.getPickableObjects().includes(draggedObjectMesh)) {
                this.objectManager.removeMesh(draggedObjectMesh);
            }
        }

    }
    private handleDragEnd(event: { object: THREE.Object3D } & THREE.Event<"dragend", DragControls>): void {
        /*this.orbitControls.enabled = true;
        const draggedObject = event.object as THREE.Group;
        if (draggedObject.children.length === 1) {
            let draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;
            this.pickableObjects.splice(this.draggableGroupIndex!, 0, draggedObjectMesh);


            if (Array.isArray(draggedObjectMesh.material)) {
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            } else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = draggedObjectMesh.materialOptions.mehsOpacity;
            }
        }
        this.draggableGroupIndex = -1*/

        //console.log(this.pickableObjects.map(obj => obj.uuid))


        this.orbitControls.enabled = true;
        const draggedObject = event.object as THREE.Group;

        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            // Додаємо сітку назад в ObjectManager після завершення drag
            this.objectManager.addMesh(draggedObjectMesh);

            // Змінюємо прозорість матеріалу (тільки якщо це не масив)
            if (Array.isArray(draggedObjectMesh.material)) {
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            } else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = draggedObjectMesh.materialOptions.mehsOpacity;
            }
        }

        // Скидаємо індекс draggableGroupIndex
        //this.draggableGroupIndex = -1;

        // Додаткове логування (опціонально)
        console.log(this.objectManager.getPickableObjects().map(obj => obj.uuid));

    }


    resizeListener(){
        window.addEventListener('resize', () => this.canvasResizeService.onCanvasResize());
        window.dispatchEvent(new Event('resize'));
    }



    private initializeGlobalVariables() {
        this.canvas = this.globalVariablesService.get('canvas') as HTMLCanvasElement;
        this.scene = this.globalVariablesService.get('scene') as THREE.Scene;
        this.camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera;
        this.renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        this.orbitControls = this.globalVariablesService.get('orbitControls') as OrbitControls;
    }

    private handleCanvasClick(event: MouseEvent): void {
        clickToCreate.call(this, event, {
            setMouse: this.setMouse.bind(this),
            createMesh: this.createMesh.bind(this),
        });
    }

    private handleCanvasMousedown(event: MouseEvent): void {
        mousedownToChoose.call(this, event, {setMouse: this.setMouse.bind(this),});
    }

    private handleCanvasMousemove(event: MouseEvent): void {
        this.hoveredPoint = meshHover.call(this, event, { setMouse: this.setMouse.bind(this) });
        if (this.hoveredPoint === null || !this.isRemoved){

            this.scene.remove(this.PointVisualisation);
        }
        else{
            this.PointVisualisation.position.copy(this.hoveredPoint);
            this.scene.add(this.PointVisualisation);
        }
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



    onDivisionOcures(divisionConfig: IDivisionConfig){
        if (this.activeObject === null) {
            console.log("No active mesh");
            return;
        }
        const oldObject = this.activeObject;
        const activeMeshPosition = new THREE.Vector3();
        oldObject.getWorldPosition(activeMeshPosition);
        const activeMeshDefaultPoints = oldObject.apiData.defaultComplexPoints!;

        this.objectManager.removeMesh(oldObject);
        this.activeObject = null;
        this.createMesh(divisionConfig, activeMeshPosition, activeMeshDefaultPoints);




        //let activeMeshPosition: THREE.Vector3 = new THREE.Vector3();
        //let activeMeshDefaultPoints: IPoint[] = this.activeObject.apiData.defaultComplexPoints!;
       /* this.activeObject.getWorldPosition(activeMeshPosition);


        if (this.activeObject && this.activeObject.parent) {
            this.groups.forEach((group: THREE.Group) => {
                if (group.children.length === 1 &&
                    this.activeObject &&
                    group.children[0].uuid === this.activeObject?.uuid
                )
                {
                    group.remove(this.activeObject);
                    this.scene.remove(group)
                }

            })
            this.activeObject.dispose();
        }
        this.activeObject = null;

        const index1 = this.pickableObjects.findIndex(obj => obj.position.equals(activeMeshPosition));
        if (index1 > -1) {
            this.pickableObjects.splice(index1, 1);
            this.draggableObjects.splice(index1, 1);
        }


        this.createMesh(divisionConfig, activeMeshPosition, activeMeshDefaultPoints);*/

    }

    createMesh(divisionConfig: IDivisionConfig = { x: 1, y: 1, z: 1 },
               oldPosition?: THREE.Vector3,
               oldDefaultPoints?: IPoint[]): void
    {
        const superGeometryMesh = new SuperGeometryMesh(
            this.apiService,
            this.globalVariablesService,
            this.dragControls,
            divisionConfig,
            oldDefaultPoints
        );

        if (oldPosition) superGeometryMesh.position.copy(oldPosition);
        else {
            const position = new THREE.Vector3();
            this.raycaster.ray.at(10, position);
            superGeometryMesh.position.copy(position);
        }

        this.objectManager.addMesh(superGeometryMesh);


        /*const group = new THREE.Group();
        this.groups.push(group);



        let position: THREE.Vector3;

        if (oldPosition)
            position = oldPosition;
        else{
            position = new THREE.Vector3();
            this.raycaster.ray.at(10, position);
        }


        superGeometryMesh.position.copy(position);
        group.add(superGeometryMesh)

        this.pickableObjects.push(superGeometryMesh);
        this.scene.add(group);*/
    }
}
