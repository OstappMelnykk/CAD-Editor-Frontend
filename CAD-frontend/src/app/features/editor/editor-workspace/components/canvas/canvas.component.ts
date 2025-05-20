import {Component, inject, OnInit} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {DragControls} from 'three/examples/jsm/controls/DragControls.js';
import {GlobalVariablesService} from 'app/core/services/three-js/global-variables.service';
import {InitService} from 'app/core/services/three-js/init.service';
import {CanvasResizeService} from 'app/core/services/three-js/canvas-resize.service';
import {CameraEventService} from 'app/core/services/state/camera-event.service';
import {ApiService} from 'app/core/services/api/api.service';
import {DivisionEventService} from 'app/core/services/state/division-event.service';
import { FacePointType, SphereWithNeighbors, SuperGeometryMesh} from 'app/core/threejsMeshes/SuperGeometryMesh';
import {clickToCreate} from './Listeners/clickToCreate';
import {mousedownToChoose} from './Listeners/mousedownToChoose';
import {meshHover} from './Listeners/meshHover';
import {DEFAULT_POINTS} from 'app/core/threejsMeshes/DefaultPoints';
import {IPoint} from 'app/core/interfaces/api/IPoint.interface';
import {ICameraPosition} from 'app/core/interfaces/three-js/ICameraPosition.interface';
import {IDivisionConfig} from 'app/core/interfaces/api/IDivisionConfig';
import {ObjectManager} from './ObjectManager';
import {ColorsEventService} from 'app/core/services/state/colors-event.service';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    standalone: true,
    styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit {

    public globalVariablesService = inject(GlobalVariablesService)
    public initService = inject(InitService);
    public canvasResizeService = inject(CanvasResizeService);
    public cameraEventService = inject(CameraEventService);
    public apiService = inject(ApiService);
    public divisionEvent = inject(DivisionEventService);
    public colorsEvent = inject(ColorsEventService);

    public canvas!: HTMLCanvasElement;
    public scene!: THREE.Scene;
    public camera!: THREE.PerspectiveCamera;
    public renderer!: THREE.WebGLRenderer;
    public orbitControls!: OrbitControls;
    public dragControls!: DragControls;

    public selection_box!: HTMLDivElement;

    public raycaster = new THREE.Raycaster();
    public mouse = new THREE.Vector2();

    public activeObject: SuperGeometryMesh | null = null;
    public hoveredObject: THREE.Object3D | null = null;
    public hoveredPoint: THREE.Vector3 | null = null;
    public PointVisualisation: THREE.Object3D = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 32), new THREE.MeshBasicMaterial({color: new THREE.Color('#00ff00')}));

    public arrowHelper = new THREE.ArrowHelper()

    public objectManager!: ObjectManager;

    public isDragging: boolean = false;
    public isHoveredAndDraging: boolean = false;

    public isCKeyPressed = false;

    public isCtrlCPressed = false;
    public isCtrlVPressed = false;


    public copied_divisionConfig: IDivisionConfig | null = null
    public copied_meshPosition: THREE.Vector3 | null = null
    public copied_activeMeshDefaultPoints: IPoint[] | null = null
    public lastMouseEvent: MouseEvent | null = null;
    public sKeyDown = false;


    ngOnInit()
    {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }

        this.selection_box = document.getElementById('selection-box') as HTMLDivElement;

        this.initService.init(canvas);
        this.resizeListener()
        this.subscriptionHandler()
        this.initializeGlobalVariables();

        this.renderer.domElement.addEventListener('click', this.handleCanvasClick.bind(this));
        this.renderer.domElement.addEventListener('mousedown', this.handleCanvasMousedown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.handleCanvasMousemove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', (event) => {
            this.orbitControls.enabled = true;
            this.selection_isDragging = false;
            this.selection_box.style.display = 'none';

        });

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'c' || event.key === 'C') {
                if (event.ctrlKey) {
                    this.isCtrlCPressed = true;
                    console.log('Ctrl + C pressed');

                    if (this.activeObject && this.lastMouseEvent) {
                        console.log("ok")

                        this.copied_divisionConfig = this.activeObject.divisionConfig
                        this.copied_activeMeshDefaultPoints = this.activeObject.apiData.defaultComplexPoints!;

                        this.setMouse(this.lastMouseEvent);
                        this.raycaster.setFromCamera(this.mouse, this.camera);

                        const position = new THREE.Vector3();
                        this.raycaster.ray.at(10, position);
                        this.copied_meshPosition = position;
                    }
                } else {
                    this.isCKeyPressed = true;
                    console.log('C pressed');
                }
            }
            else if (event.key === 'v' || event.key === 'V') {
                if (event.ctrlKey) {
                    this.isCtrlVPressed = true;
                    console.log('Ctrl + V pressed');

                    if (this.copied_divisionConfig === null || this.copied_meshPosition === null || this.copied_activeMeshDefaultPoints === null) {
                        console.log(this.copied_divisionConfig)
                        console.log(this.copied_meshPosition)
                        console.log(this.copied_activeMeshDefaultPoints)
                        console.error('No copied data');
                        return;
                    }
                    this.createMesh(this.copied_divisionConfig, this.copied_meshPosition, this.copied_activeMeshDefaultPoints);
                }
            }
            else if (event.key === 's' || event.key === 'S') {
                this.sKeyDown = true;
                console.log('S pressed');
            }
        });

        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === 'c' || event.key === 'C') {
                this.isCKeyPressed = false;
                this.isCtrlCPressed = false;
            }
            else if (event.key === 'v' || event.key === 'V') {
                this.isCtrlVPressed = false;
            }
            else if (event.key === 's' || event.key === 'S') {
                this.sKeyDown = false;
            }
        });

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
            if (this.activeObject === null) {
                console.log("No active mesh");
                return;
            }
            this.onDivisionOcures(this.activeObject, divisionConfig);
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
        this.isDragging = true
        const draggedObject = event.object as THREE.Group;



        if (draggedObject.children.length === 1) {
            let draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            if (Array.isArray(draggedObjectMesh.material))
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            else {
                //if
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
            /*const allSpheres = SuperGeometryMesh.allDefaultSpheres as SphereWithNeighbors[];
            draggedObjectMesh.updateSphereColorsBasedOnGroups(allSpheres);
            draggedObjectMesh.updateSphereNeighbors(allSpheres);*/
        }

    }
    private async handleDragEnd(event: { object: THREE.Object3D } & THREE.Event<"dragend", DragControls>): Promise<void> {
        this.orbitControls.enabled = true;

        const draggedObject = event.object as THREE.Group;

        /////////////////////////////////////////////
        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;
            if (Array.isArray(draggedObjectMesh.material))
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = draggedObjectMesh.materialOptions.mehsOpacity;
            }
        }

        if (draggedObject.children.length === 1) {
            const draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;
            draggedObjectMesh.updateAverageCoordinates();

        }
        /////////////////////////////////////////////




        if(this.hoveredObject && this.isDragging && this.hoveredObject.uuid !== this.activeObject?.uuid && this.isCKeyPressed) {
            let minDistance = Infinity;
            let closestSideIndex = -1;

            let hoveredMesh = this.hoveredObject as SuperGeometryMesh;
            let activeMesh = this.activeObject as SuperGeometryMesh;

            hoveredMesh.allSidesData.forEach((side, index) => {
                const distance = this.hoveredPoint!.distanceTo(side.middlePoint);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestSideIndex = index;
                }

            });

            if (closestSideIndex === -1)
                return;

            const closestSideData = hoveredMesh.allSidesData[closestSideIndex];

            let hoveredMesh_DivisionConfig = hoveredMesh.divisionConfig
            let activeMesh_DivisionConfig = activeMesh.divisionConfig


            if (
                hoveredMesh_DivisionConfig.x !== activeMesh_DivisionConfig.x ||
                hoveredMesh_DivisionConfig.y !== activeMesh_DivisionConfig.y ||
                hoveredMesh_DivisionConfig.z !== activeMesh_DivisionConfig.z
            ) {
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
                let newMesh = await this.createMesh(hoveredMesh_DivisionConfig, activeMeshPosition, activeMeshDefaultPoints);
                this.activeObject = newMesh;
                activeMesh = this.activeObject as SuperGeometryMesh;
                console.log("CHANGE DIVISION CONFIG")
            }


            for (let i = 0; i < closestSideData.arrayIDs.length; i++) {
                let id_arrayToConnect = closestSideData.arrayIDs[i]
                let id_oppositeArrayToConnect = closestSideData.oppositeArrayIDs[i]

                const active_matchedObject = activeMesh.defaultSpheres.find(obj => (obj.userData['globalId'] - 1) === id_oppositeArrayToConnect);
                const hovered_matchedObject = hoveredMesh.defaultSpheres.find(obj => (obj.userData['globalId'] - 1) === id_arrayToConnect);


                if (active_matchedObject && hovered_matchedObject){
                    if ((active_matchedObject as THREE.Mesh).material instanceof THREE.Material) {
                        ((active_matchedObject as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set('yellow');
                    }

                    if ((hovered_matchedObject as THREE.Mesh).material instanceof THREE.Material) {
                        ((hovered_matchedObject as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set('yellow');
                    }

                    const parent = active_matchedObject!.parent as SuperGeometryMesh;

                    let draggablePointIndex = parent.apiData.defaultComplexPoints!.findIndex(
                        defaultPoint => parent.comparePositions(
                            {x: defaultPoint.x, y: defaultPoint.y, z: defaultPoint.z},
                            active_matchedObject!.position
                        )
                    );

                    const targetSphereWorldPosition = new THREE.Vector3();
                    hovered_matchedObject!.getWorldPosition(targetSphereWorldPosition);

                    const localCoordinate = active_matchedObject!.parent!.worldToLocal(targetSphereWorldPosition.clone())
                    active_matchedObject!.position.copy(localCoordinate);


                    parent.apiData.defaultComplexPoints![draggablePointIndex].x = localCoordinate.x;
                    parent.apiData.defaultComplexPoints![draggablePointIndex].y = localCoordinate.y;
                    parent.apiData.defaultComplexPoints![draggablePointIndex].z = localCoordinate.z;

                    parent.setNewCalculatedPoints();
                    parent.updateAverageCoordinates();
                }
            }

            hoveredMesh.neightbours.push(activeMesh)
            activeMesh.neightbours.push(hoveredMesh)
        }




        if (draggedObject.children.length === 1) {
            let draggedObjectMesh = draggedObject.children[0] as SuperGeometryMesh;

            if (Array.isArray(draggedObjectMesh.material))
                console.warn('Material is an array. Cannot set opacity on an array of materials.');
            else {
                draggedObjectMesh.material.transparent = true;
                draggedObjectMesh.material.opacity = 1;
            }
        }


        this.isDragging = false;
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
        this.lastMouseEvent = event;
    }

    private selection_startX: number = 0;
    private selection_startY: number = 0;
    public selection_isDragging: boolean = false;



    private handleCanvasMousedown(event: MouseEvent): void {

        if (event.button === 0 && this.sKeyDown) {
            console.log('Виділення з клавішею S');
            this.orbitControls.enabled = false;

            this.selection_isDragging = true;
            this.selection_startX = event.clientX;
            this.selection_startY = event.clientY;

            this.selection_box.style.left = `${event.clientX}px`;
            this.selection_box.style.top = `${event.clientY}px`;
            this.selection_box.style.width = '0px';
            this.selection_box.style.height = '0px';
            this.selection_box.style.display = 'block';
        }
        else{
            mousedownToChoose.call(this, event, {setMouse: this.setMouse.bind(this),});
        }

        this.lastMouseEvent = event;
    }
    private handleCanvasMousemove(event: MouseEvent): void {

        if (event.button === 0 && this.sKeyDown) {
            if (!this.selection_isDragging) return;

            const currentX = event.clientX;
            const currentY = event.clientY;

            const x = Math.min(currentX, this.selection_startX);
            const y = Math.min(currentY, this.selection_startY);
            const width = Math.abs(currentX - this.selection_startX);
            const height = Math.abs(currentY - this.selection_startY);

            this.selection_box.style.left = `${x}px`;
            this.selection_box.style.top = `${y}px`;
            this.selection_box.style.width = `${width}px`;
            this.selection_box.style.height = `${height}px`;
        }
        else{
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

                if (this.isDragging) {
                    if (this.hoveredObject)
                        this.isHoveredAndDraging = true;
                    else
                        this.isHoveredAndDraging = false;
                }
                else
                    this.isHoveredAndDraging = false;
            }
        }

        this.lastMouseEvent = event;
    }

    setMouse(event: MouseEvent): void{
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / this.canvasResizeService.canvasSize.Width!) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / this.canvasResizeService.canvasSize.Height!) * 2 + 1;
        this.mouse.set(mouseX, mouseY);
    }

    onCameraPositionChanged(cameraPosition: ICameraPosition): void {
        this.camera?.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        this.camera?.lookAt(0, 0, 0);
        this.orbitControls?.target.set(0, 0, 0);
        this.orbitControls?.update();
    }

    async onDivisionOcures(
        meshToDivide: SuperGeometryMesh,
        divisionConfig: IDivisionConfig,
        visited: Set<string> = new Set(),
        newParentMesh?: SuperGeometryMesh)
    {
        if (!meshToDivide) {
            return;
        }

        if (visited.has(meshToDivide.uuid)) {
            return;
        }

        visited.add(meshToDivide.uuid);

        const oldObject = meshToDivide;
        const activeMeshPosition = new THREE.Vector3();
        oldObject.getWorldPosition(activeMeshPosition);
        const activeMeshDefaultPoints = oldObject.apiData.defaultComplexPoints!;

        const oldNeighbours = [...oldObject.neightbours];

        this.objectManager.removeMesh(oldObject);
        this.updateDragControls();
        this.activeObject = null;
        const newMesh = await this.createMesh(divisionConfig, activeMeshPosition, activeMeshDefaultPoints);

        if(newParentMesh){
            newParentMesh.neightbours.push(newMesh)
            newMesh.neightbours.push(newParentMesh)
        }

        if (meshToDivide.neightbours.length === 0) return;

        for (const neighbor of oldNeighbours)
            await this.onDivisionOcures(neighbor, divisionConfig, visited, newMesh);

    }
    async createMesh(divisionConfig: IDivisionConfig = { x: 1, y: 1, z: 1 },
                     oldPosition?: THREE.Vector3,
                     oldDefaultPoints?: IPoint[]): Promise<SuperGeometryMesh>
    {
        const superGeometryMesh = new SuperGeometryMesh(
            this.apiService,
            this.globalVariablesService,
            this.dragControls,
            divisionConfig,
            oldDefaultPoints
        );

        await firstValueFrom(superGeometryMesh.apiDataLoaded$);

        if (oldPosition) superGeometryMesh.position.copy(oldPosition);
        else {
            const position = new THREE.Vector3();
            this.raycaster.ray.at(10, position);
            superGeometryMesh.position.copy(position);
        }

        this.objectManager.addMesh(superGeometryMesh);
        this.updateDragControls();
        return superGeometryMesh
    }

    private updateDragControls(): void {
        this.dragControls.objects = this.objectManager.getGroups();
    }
}
