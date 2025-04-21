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
import {FacePointType, SuperGeometryMesh} from '../../../../../core/threejsMeshes/SuperGeometryMesh';
import {clickToCreate} from './Listeners/clickToCreate';
import {mousedownToChoose} from './Listeners/mousedownToChoose';
import {meshHover} from './Listeners/meshHover';
import {DEFAULT_POINTS} from '../../../../../core/threejsMeshes/DefaultPoints';
import {IPoint} from '../../../../../core/interfaces/api/IPoint.interface';
import {ICameraPosition} from '../../../../../core/interfaces/three-js/ICameraPosition.interface';
import {IDivisionConfig} from '../../../../../core/interfaces/api/IDivisionConfig';
import {ObjectManager} from './ObjectManager';
import {ColorsEventService} from '../../../../../core/services/state/colors-event.service';

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
    colorsEvent = inject(ColorsEventService);

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

    arrowHelper = new THREE.ArrowHelper()

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

        this.renderer.domElement.addEventListener('click', this.handleCanvasClick.bind(this));
        this.renderer.domElement.addEventListener('mousedown', this.handleCanvasMousedown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.handleCanvasMousemove.bind(this));

        this.apiService.DefaultPoints().subscribe({
            next: (defaultPoints) => {
                DEFAULT_POINTS.push(...defaultPoints as IPoint[])
                DEFAULT_POINTS.sort((a, b) => a.localIds[0] - b.localIds[0]);
            },
            error: (err) => console.error('Error while fetching DefaultPoints:', err),
        });


        this.objectManager = new ObjectManager(this.scene);
        this.dragControls = new DragControls(this.objectManager.getGroups(), this.camera, this.renderer.domElement);
        this.dragControls.transformGroup = true;
        this.dragControls.raycaster.params.Line.threshold = 0.01;

        this.dragControls.addEventListener('dragstart', (event) => {this.handleDragStart(event);});
        this.dragControls.addEventListener('drag', (event) => {this.handleDrag(event);});
        this.dragControls.addEventListener('dragend', (event) => {this.handleDragEnd(event);});

        this.arrowHelper.setLength(3)
    }

    subscriptionHandler(){
        this.cameraEventService.cameraEvent$.subscribe((cameraPosition: ICameraPosition) => {
            this.onCameraPositionChanged(cameraPosition);
        })

        this.divisionEvent.divisionEvent$.subscribe((divisionConfig) => {
            this.onDivisionOcures(divisionConfig);
        })


        this.colorsEvent.defaultMeshColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.defaultMeshColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.hoverMeshColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.hoverMeshColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.activeMeshColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.activeMeshColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.wireframeColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.wireframeColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.defaultSphereColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.defaultSphereColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.draggableSphereColorEvent$.subscribe((color) => {
            if(this.activeObject){
                this.activeObject.meshColors.draggableSphereColor = new THREE.Color(color);
            }
        })
        this.colorsEvent.meshOpacityEvent$.subscribe((opacity)=>{
            if(this.activeObject){
                this.activeObject.materialOptions.mehsOpacity = opacity;
            }
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
        const draggedObject = event.object as THREE.Group;
        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;
            draggedObjectMesh.updateAverageCoordinates();
        }

    }

    private handleDragEnd(event: { object: THREE.Object3D } & THREE.Event<"dragend", DragControls>): void
    {
        this.orbitControls.enabled = true;
        const draggedObject = event.object as THREE.Group;

        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;
            if (Array.isArray(draggedObjectMesh.material))
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = draggedObjectMesh.materialOptions.mehsOpacity;
            }
        }
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

        const result = meshHover.call(this, event, { setMouse: this.setMouse.bind(this) })
        if (!result) {
            this.scene.remove(this.arrowHelper);
            this.scene.remove(this.PointVisualisation);
            return;
        }
        else{
            this.hoveredPoint = result!.intersectedPoint;
            const directionVector = result!.directionVector
            this.arrowHelper.position.copy(this.hoveredPoint);
            this.scene.add(this.arrowHelper);
            this.arrowHelper.setDirection(directionVector);
            this.PointVisualisation.position.copy(this.hoveredPoint);
            this.scene.add(this.PointVisualisation);


            let arr = new Array<number>();
            const hoveredObjectMesh = this.hoveredObject as SuperGeometryMesh;
            let minDistance = Infinity;
            let closestSideIndex = -1;

            hoveredObjectMesh.allSides.forEach((side, index) => {
                const distance = this.hoveredPoint!.distanceTo(side.middlePoint);
                arr.push(distance);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestSideIndex = index;
                }
            });

            if (closestSideIndex !== -1) {
                const closestSide = hoveredObjectMesh.allSides[closestSideIndex];
                //console.log("Найближча грань:", closestSide.facePointType);
                if (closestSide.facePointType ===  FacePointType.NegativeFace_X_Points){console.log("-X")}
                if (closestSide.facePointType ===  FacePointType.NegativeFace_Y_Points){console.log("-Y")}
                if (closestSide.facePointType ===  FacePointType.NegativeFace_Z_Points){console.log("-Z")}
                if (closestSide.facePointType ===  FacePointType.PositiveFace_X_Points){console.log("+X")}
                if (closestSide.facePointType ===  FacePointType.PositiveFace_Y_Points){console.log("+Y")}
                if (closestSide.facePointType ===  FacePointType.PositiveFace_Z_Points){console.log("+Z")}
            }

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
        this.updateDragControls();
        this.activeObject = null;
        this.createMesh(divisionConfig, activeMeshPosition, activeMeshDefaultPoints);
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
        this.updateDragControls();
    }

    private updateDragControls(): void {
        this.dragControls.objects = this.objectManager.getGroups();
    }
}
