import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { IAPIData } from '../interfaces/api/IAPIData.interface';
import { IPoint } from '../interfaces/api/IPoint.interface';
import { IPosition } from '../interfaces/three-js/IPosition.interface';
import {IMeshColors} from './interfaces/IMeshColors.interface';
import {IMaterialOptions} from './interfaces/IMaterialOptions';

import { ApiService } from '../services/api/api.service';
import { GlobalVariablesService } from '../services/three-js/global-variables.service';

import { createDraggableSphere } from './utils/createDraggableSphere';
import { createDefaultSphere } from './utils/createDefaultSphere';
import {DEFAULT_POINTS} from './DefaultPoints';
import {IDivisionConfig} from '../interfaces/api/IDivisionConfig';
import {forkJoin, Observable, Subject} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export class SuperGeometryMesh extends THREE.Mesh {

    static ID = 0;

    public readonly meshColors: IMeshColors = {
        defaultMeshColor: new THREE.Color('#5a8be2'),
        hoverMeshColor: new THREE.Color('rgba(0,89,255)'),  //rgba(0,89,255,0.61)
        //activeMeshColor: new THREE.Color('rgba(255,4,4)'),  //rgba(255,4,4,0.7)
        activeMeshColor: new THREE.Color('rgb(248,150,150)'),  //rgba(255,4,4,0.7)
        wireframeColor: new THREE.Color(0xbfc2c7),
        defaultSphereColor: new THREE.Color(0xbfc2c7),
        draggableSphereColor: new THREE.Color('rgba(255,4,4)'),
    }
    public readonly materialOptions: IMaterialOptions = {
        wireframeOpacity: 0.2,
        mehsOpacity: 0.1,
        wireframe: false,
        depthWrite: false,
        depthTest: true
    }

    public scene!: THREE.Scene;
    public camera!: THREE.PerspectiveCamera;
    public renderer!: THREE.WebGLRenderer;
    public orbitControls!: OrbitControls;
    public dragControls!: DragControls;

    public lineSegments!: THREE.LineSegments;
    public lineMaterial!: THREE.LineBasicMaterial;
    public lineGeometry!: THREE.BufferGeometry;

    public apiData!: IAPIData;

    public spheres: THREE.Object3D[] = [];
    public defaultSpheres: THREE.Object3D[] = [];

    public draggablePointIndex: number = -1;
    public isDragging = false;

    private apiDataLoaded$ = new Subject<void>();

    allSidesData: SideData[] = []
    allSidesPoints: number[] = []
    AverageCoordinateMarkers: THREE.Object3D[] = []


    static allMeshes: SuperGeometryMesh[] = [];
    static allDefaultSpheres: THREE.Object3D[] = [];

    static groups: Map<string, THREE.Group> = new Map();
    static allGroups:SphereWithNeighbors[][] = []



    public GROUP_DISTANCE = 0.35;

    constructor(
        private apiService: ApiService,
        private globalVariablesService: GlobalVariablesService,
        private outerDragControls: DragControls,
        private divisionConfig: IDivisionConfig,
        DefaultPoints?: IPoint[]
    )
    {
        super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());

        SuperGeometryMesh.ID++;
        SuperGeometryMesh.allMeshes.push(this);

        this.scene = this.globalVariablesService.get('scene') as THREE.Scene;
        this.camera = this.globalVariablesService.get('camera') as THREE.PerspectiveCamera;
        this.renderer = this.globalVariablesService.get('renderer') as THREE.WebGLRenderer;
        this.orbitControls = this.globalVariablesService.get('orbitControls') as OrbitControls;

        this.initializeApiData();

        this.apiDataLoaded$.subscribe(() => {
            this.initializeMaterial();
            this.initializeGeometry();
            this.createSpheres();
            if (DefaultPoints) this.setDefaultPoints(DefaultPoints);



            this.fetchPoints().subscribe({
                next: (results) => {
                    this.allSidesData.push({facePointType: FacePointType.NegativeFace_X_Points, arrayIDs: results.NegativeFace_X_Points, middlePoint:this.GetAverageCoordinate(results.NegativeFace_X_Points)})
                    this.allSidesData.push({facePointType: FacePointType.NegativeFace_Y_Points, arrayIDs: results.NegativeFace_Y_Points, middlePoint:this.GetAverageCoordinate(results.NegativeFace_Y_Points)})
                    this.allSidesData.push({facePointType: FacePointType.NegativeFace_Z_Points, arrayIDs: results.NegativeFace_Z_Points, middlePoint:this.GetAverageCoordinate(results.NegativeFace_Z_Points)})
                    this.allSidesData.push({facePointType: FacePointType.PositiveFace_X_Points, arrayIDs: results.PositiveFace_X_Points, middlePoint:this.GetAverageCoordinate(results.PositiveFace_X_Points)})
                    this.allSidesData.push({facePointType: FacePointType.PositiveFace_Y_Points, arrayIDs: results.PositiveFace_Y_Points, middlePoint:this.GetAverageCoordinate(results.PositiveFace_Y_Points)})
                    this.allSidesData.push({facePointType: FacePointType.PositiveFace_Z_Points, arrayIDs: results.PositiveFace_Z_Points, middlePoint:this.GetAverageCoordinate(results.PositiveFace_Z_Points)})

                    this.allSidesPoints = [
                        ...results.NegativeFace_X_Points,
                        ...results.NegativeFace_Y_Points,
                        ...results.NegativeFace_Z_Points,
                        ...results.PositiveFace_X_Points,
                        ...results.PositiveFace_Y_Points,
                        ...results.PositiveFace_Z_Points,
                    ]
                    this.setAverageCoordinateSpheres()
                },
                error: (err) => {
                    console.error('Error fetching data:', err);
                }
            });
        });
    }

    GetAverageCoordinate(arrayIDs: number[]): THREE.Vector3 {
        const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;

        const sum = arrayIDs.reduce((acc, index) => {
            acc.x += positionAttribute.getX(index);
            acc.y += positionAttribute.getY(index);
            acc.z += positionAttribute.getZ(index);
            return acc;
        }, { x: 0, y: 0, z: 0 });

        const localPoint = new THREE.Vector3(
            sum.x / arrayIDs.length,
            sum.y / arrayIDs.length,
            sum.z / arrayIDs.length
        );
        const globalPoint = localPoint.applyMatrix4(this.matrixWorld);

        return globalPoint;
    }
    setAverageCoordinateSpheres(){
        this.allSidesData.forEach(side => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                new THREE.MeshBasicMaterial({ color: 'white' })
            );

            sphere.position.copy(side.middlePoint);

            this.AverageCoordinateMarkers.push(sphere);
            this.scene.add(sphere);
        })
    }
    updateAverageCoordinates(){
        this.allSidesData.forEach(side => {side.middlePoint = this.GetAverageCoordinate(side.arrayIDs);})
        for (let i = 0; i < this.AverageCoordinateMarkers.length; i++)
            this.AverageCoordinateMarkers[i].position.copy(this.allSidesData[i].middlePoint);
    }
    fetchPoints(): Observable<any> {
        return forkJoin({
            NegativeFace_X_Points: this.NegativeFace_X_Points(),
            NegativeFace_Y_Points: this.NegativeFace_Y_Points(),
            NegativeFace_Z_Points: this.NegativeFace_Z_Points(),
            PositiveFace_X_Points: this.PositiveFace_X_Points(),
            PositiveFace_Y_Points: this.PositiveFace_Y_Points(),
            PositiveFace_Z_Points: this.PositiveFace_Z_Points()
        });
    }
    NegativeFace_X_Points(): Observable<number[]> {
        return this.apiService.NegativeFace_X_Points();
    }
    NegativeFace_Y_Points(): Observable<number[]> {
        return this.apiService.NegativeFace_Y_Points();
    }
    NegativeFace_Z_Points(): Observable<number[]> {
        return this.apiService.NegativeFace_Z_Points();
    }
    PositiveFace_X_Points(): Observable<number[]> {
        return this.apiService.PositiveFace_X_Points();
    }
    PositiveFace_Y_Points(): Observable<number[]> {
        return this.apiService.PositiveFace_Y_Points();
    }
    PositiveFace_Z_Points(): Observable<number[]> {
        return this.apiService.PositiveFace_Z_Points();
    }
    private initializeApiData(): void {
        this.apiService.Divide(this.divisionConfig).subscribe({
            next: () => {
                forkJoin({
                    points: this.apiService.Points(),
                    pairsOfIndices: this.apiService.PairsOfIndices(),
                    polygons: this.apiService.Polygons(),
                    defaultComplexPoints: this.apiService.DefaultPoints(),
                }).subscribe({
                    next: (apiData: IAPIData) => {
                        let defaultPoints = apiData.defaultComplexPoints!;

                        const hasInvalidPoints = defaultPoints.some(point => point.localIds.length > 1);
                        if (hasInvalidPoints) {
                            console.error('Invalid points detected');
                            return;
                        }

                        defaultPoints.sort((a, b) => a.localIds[0] - b.localIds[0]);

                        this.apiData = {
                            points: apiData.points!,
                            pairsOfIndices: apiData.pairsOfIndices!,
                            polygons: apiData.polygons!,
                            defaultComplexPoints: defaultPoints
                        };

                        this.apiDataLoaded$.next();
                    },
                    error: (error) => {
                        console.error('Error loading API data:', error);
                    }
                });
            },
            error: (error) => {
                console.error('Error during division:', error);
            }
        });
    }
    setDefaultPoints(newDefaultPoints: IPoint[]){
        this.apiData.defaultComplexPoints = newDefaultPoints;
        this.setNewCalculatedPoints();
    }
    setNewCalculatedPoints(){
        const newPoints = this.Calculate();

        this.spheres.forEach((sphere, index) => {
            if (sphere instanceof THREE.Mesh) {
                sphere.position.set(
                    newPoints![index].x,
                    newPoints![index].y,
                    newPoints![index].z
                );
            }
        });

        const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;
        const linePositionAttribute = this.lineGeometry.getAttribute('position') as THREE.BufferAttribute;

        newPoints.forEach((point, index) => {
            positionAttribute.setXYZ(index, point.x, point.y, point.z);
            linePositionAttribute.setXYZ(index, point.x, point.y, point.z);
        });

        positionAttribute.needsUpdate = true;
        linePositionAttribute.needsUpdate = true;

        this.geometry.computeBoundingBox();
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();
    }
    private initializeMaterial() {
        this.material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            wireframe: this.materialOptions.wireframe,
            transparent: true,
            opacity: this.materialOptions.mehsOpacity,
            depthWrite: this.materialOptions.depthWrite,
            depthTest: this.materialOptions.depthTest,
            side: THREE.DoubleSide,
        });
    }
    private initializeGeometry(): void {
        this.geometry = new THREE.BufferGeometry();

        const vertices = this.extractVertices();
        const indices = this.extractIndices();
        const colors = this.generateColors();

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        this.geometry.setIndex(indices);
        this.geometry.computeVertexNormals();
        this.initializeLineSegments()
    }
    private extractVertices(): number[] {
        return this.apiData.points!.flatMap((point) => [point.x, point.y, point.z]);
    }
    private extractIndices(): number[] {
        return this.ensureOutwardNormals(this.apiData.polygons!.flatMap((polygon) => [polygon.idx1, polygon.idx2, polygon.idx3]));
    }
    private generateColors(): number[] {
        return this.apiData.polygons!.flatMap(() => {
            const color = this.meshColors.defaultMeshColor;
            return [color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b];
        });
    }
    private initializeLineSegments(): void {
        const lineGeometry = new THREE.BufferGeometry();

        const vertices: number[] = this.apiData.points!.flatMap((point) => [point.x, point.y, point.z]);
        const indices: number[] = this.apiData.pairsOfIndices!.flatMap((pair) => [pair.idx1, pair.idx2]);

        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        lineGeometry.setIndex(indices);
        lineGeometry.computeVertexNormals();

        this.lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color('#fff')});
        this.lineGeometry = lineGeometry;

        this.lineSegments = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
        this.add(this.lineSegments);
    }
    private ensureOutwardNormals(polygonIndices: number[]): number[] {
        const correctedIndices: number[] = [];

        const centroid = new THREE.Vector3();
        this.apiData.points!.forEach((point) => {
            centroid.add(new THREE.Vector3(point.x, point.y, point.z));
        });
        centroid.divideScalar(this.apiData.points!.length);

        for (let i = 0; i < polygonIndices.length; i += 3) {
            const idx1 = polygonIndices[i];
            const idx2 = polygonIndices[i + 1];
            const idx3 = polygonIndices[i + 2];

            const p1 = new THREE.Vector3(this.apiData.points![idx1].x, this.apiData.points![idx1].y, this.apiData.points![idx1].z);
            const p2 = new THREE.Vector3(this.apiData.points![idx2].x, this.apiData.points![idx2].y, this.apiData.points![idx2].z);
            const p3 = new THREE.Vector3(this.apiData.points![idx3].x, this.apiData.points![idx3].y, this.apiData.points![idx3].z);

            const normal = new THREE.Vector3().crossVectors(
                new THREE.Vector3().subVectors(p2, p1),
                new THREE.Vector3().subVectors(p3, p1)
            ).normalize();

            const toCentroid = new THREE.Vector3().subVectors(p1, centroid);
            if (normal.dot(toCentroid) < 0)
                correctedIndices.push(idx1, idx3, idx2);
            else
                correctedIndices.push(idx1, idx2, idx3);
        }
        return correctedIndices;
    }
    private createSpheres(): void {

        this.spheres = [];
        this.defaultSpheres = [];

        this.apiData.points!.forEach((point) => {
            const position: IPosition = { x: point.x, y: point.y, z: point.z };

            const pointExists = DEFAULT_POINTS.some(
                defaultPoint =>
                    defaultPoint.x === point.x &&
                    defaultPoint.y === point.y &&
                    defaultPoint.z === point.z
            );

            const sphere = pointExists
                ? createDraggableSphere(
                    position,
                    this.meshColors.draggableSphereColor,
                    point.globalId,
                    point.localIds
                )
                : createDefaultSphere(
                    position,
                    this.meshColors.defaultSphereColor,
                    point.globalId,
                    point.localIds
                );

            this.add(sphere);
            this.spheres.push(sphere);

            if (pointExists)
                this.defaultSpheres.push(sphere);
        });

        if (this.defaultSpheres.length > 0) {
            SuperGeometryMesh.allDefaultSpheres.push(...this.defaultSpheres);
            this.addDragControls();

        }
    }
    private addDragControls() {
        this.initializeDragControls()

        this.dragControls.addEventListener('dragstart', (event) => {this.handleDragStart(event);});
        this.dragControls.addEventListener('drag', (event) => {this.handleDrag(event);});
        this.dragControls.addEventListener('dragend', (event) => {this.handleDragEnd(event);});
        this.renderer.domElement.addEventListener('mouseup', () => {this.handleMouseup()})
    }
    private comparePositions(pos1: IPosition, pos2: IPosition, tolerance = 0.001) {
        return Math.abs(pos1.x - pos2.x) < tolerance &&
            Math.abs(pos1.y - pos2.y) < tolerance &&
            Math.abs(pos1.z - pos2.z) < tolerance;
    };


    private handleDragStart(event: { object: THREE.Object3D } & THREE.Event<"dragstart", DragControls>): void {

        const parent = (event.object as THREE.Mesh).parent as SuperGeometryMesh;



        console.log("this" + new Date().toLocaleTimeString() + " -----------------")
        console.log(parent)
        console.log("this end ----------------------------------")

        if (!this.defaultSpheres.includes(event.object)) return;

        this.isDragging = true;
        this.orbitControls.enabled = false;
        this.outerDragControls.enabled = false;

        const sphere = event.object as THREE.Mesh;
        console.log(sphere.uuid)
        sphere.scale.set(2, 2, 2);
        (this as any).draggingSphere = sphere;

        this.draggablePointIndex = this.apiData.defaultComplexPoints!.findIndex(
            defaultPoint => this.comparePositions(
                {x: defaultPoint.x, y: defaultPoint.y, z: defaultPoint.z},
                sphere.position
            )
        );
        if (this.draggablePointIndex === -1)
            return;

    }
    private handleDrag(event: { object: THREE.Object3D } & THREE.Event<"drag", DragControls>): void {

        if (!this.isDragging || this.draggablePointIndex === -1) return;
        const draggableSphere = event.object as THREE.Mesh;

        const parent = draggableSphere.parent as SuperGeometryMesh;


        console.log(parent)
        if (parent) {
            parent.apiData.defaultComplexPoints![parent.draggablePointIndex].x = draggableSphere.position.x;
            parent.apiData.defaultComplexPoints![parent.draggablePointIndex].y = draggableSphere.position.y;
            parent.apiData.defaultComplexPoints![parent.draggablePointIndex].z = draggableSphere.position.z;

            parent.setNewCalculatedPoints();
            parent.updateAverageCoordinates();

            const allSpheres = SuperGeometryMesh.allDefaultSpheres as SphereWithNeighbors[];
            this.updateSphereColorsBasedOnGroups(allSpheres);
            this.updateSphereNeighbors(allSpheres);
        }

        const allSpheres = SuperGeometryMesh.allDefaultSpheres as SphereWithNeighbors[];
        const neighbors = draggableSphere.userData['neighbors'] as string[] ?? [];
        if (neighbors.length > 0){
            neighbors.forEach(neighbor => {
                const neighborSphere = allSpheres.find(s => s.uuid === neighbor);

                if (neighborSphere && this.areSpheresCloseEnoughByDistance(neighborSphere, draggableSphere, this.GROUP_DISTANCE / 4)){

                    const parent = neighborSphere.parent as SuperGeometryMesh;



                    if (parent){

                        parent.draggablePointIndex = parent.apiData.defaultComplexPoints!.findIndex(
                            defaultPoint => this.comparePositions(
                                {x: defaultPoint.x, y: defaultPoint.y, z: defaultPoint.z},
                                neighborSphere.position
                            )
                        );


                        const draggableSphereWorldPosition = new THREE.Vector3();
                        draggableSphere.updateMatrixWorld(true);
                        draggableSphere.getWorldPosition(draggableSphereWorldPosition)


                        /*const neighborSphereWorldPosition = new THREE.Vector3();
                        neighborSphere.getWorldPosition(neighborSphereWorldPosition);*/

                        const localCoordinate = parent.worldToLocal(draggableSphereWorldPosition.clone())


                        parent.apiData.defaultComplexPoints![parent.draggablePointIndex].x = localCoordinate.x;
                        parent.apiData.defaultComplexPoints![parent.draggablePointIndex].y = localCoordinate.y;
                        parent.apiData.defaultComplexPoints![parent.draggablePointIndex].z = localCoordinate.z;

                        parent.setNewCalculatedPoints();
                        parent.updateAverageCoordinates();
                    }

                }
            })
        }

    }


    areSpheresCloseEnoughByDistance(
        sphere1: THREE.Object3D,
        sphere2: THREE.Object3D,
        epsilon: number
    ): boolean {
        const pos1 = new THREE.Vector3();
        const pos2 = new THREE.Vector3();

        sphere1.updateMatrixWorld(true);
        sphere2.updateMatrixWorld(true);


        sphere1.getWorldPosition(pos1);
        sphere2.getWorldPosition(pos2);

        const distance = pos1.distanceTo(pos2);

        return distance <= epsilon;
    }




    private handleDragEnd(event: { object: THREE.Object3D } & THREE.Event<"dragend", DragControls>): void {

        //console.log("Drag end — index before:", this.draggablePointIndex);

        this.isDragging = false;
        this.orbitControls.enabled = true;
        this.outerDragControls.enabled = true;

        const movingSphere = event.object as THREE.Mesh;
        movingSphere.scale.set(1, 1, 1);


        const parent = movingSphere.parent as SuperGeometryMesh;

        if (parent) {
            const allSpheres = SuperGeometryMesh.allDefaultSpheres as SphereWithNeighbors[];
            const neighbors = movingSphere.userData['neighbors'] as string[] ?? [];

            if (neighbors.length > 0) {
                const neighborSphere = allSpheres.find(s => s.uuid === neighbors[0]);
                if (neighborSphere){

                    const neighborSphereWorldPosition = new THREE.Vector3();
                    neighborSphere.getWorldPosition(neighborSphereWorldPosition);

                    const localCoordinate = movingSphere!.parent!.worldToLocal(neighborSphereWorldPosition.clone())
                    movingSphere.position.copy(localCoordinate);

                    console.log(this.draggablePointIndex)

                    parent.apiData.defaultComplexPoints![parent.draggablePointIndex].x = localCoordinate.x;
                    parent.apiData.defaultComplexPoints![parent.draggablePointIndex].y = localCoordinate.y;
                    parent.apiData.defaultComplexPoints![parent.draggablePointIndex].z = localCoordinate.z;

                    parent.setNewCalculatedPoints();
                    parent.updateAverageCoordinates();
                }
            }

        }

        this.draggablePointIndex = -1;
        (this as any).draggingSphere = null;
    }


    public dragObject(TargetObject: THREE.Object3D, CurrentObject: THREE.Object3D): void {
        const TargetObjectWorldPos = new THREE.Vector3();
        TargetObject.updateMatrixWorld(true);
        TargetObject.getWorldPosition(TargetObjectWorldPos);

        if (CurrentObject.parent) CurrentObject.parent.worldToLocal(TargetObjectWorldPos);
        CurrentObject.position.copy(TargetObjectWorldPos);
    }



    updateSphereNeighbors(spheres: SphereWithNeighbors[]) {
        for (const sphere of spheres) {

            const spherePos = new THREE.Vector3();
            sphere.getWorldPosition(spherePos);

            sphere.userData.neighbors = [];

            for (const other of spheres) {
                if (sphere.uuid === other.uuid) continue;

                const otherPos = new THREE.Vector3();
                other.getWorldPosition(otherPos);

                if (spherePos.distanceTo(otherPos) <= this.GROUP_DISTANCE) {
                    sphere.userData.neighbors!.push(other.uuid);
                }
            }
        }
    }
    findGroups(spheres: SphereWithNeighbors[]): SphereWithNeighbors[][] {
        const visited = new Set<string>();
        const groups: SphereWithNeighbors[][] = [];
        SuperGeometryMesh.allGroups = []

        for (const sphere of spheres) {
            if (visited.has(sphere.uuid)) continue;

            const group: SphereWithNeighbors[] = [];
            const stack = [sphere];

            while (stack.length > 0) {
                const current = stack.pop()!;
                if (visited.has(current.uuid)) continue;

                visited.add(current.uuid);
                group.push(current);

                const neighbors = current.userData.neighbors || [];
                for (const uuid of neighbors) {
                    const neighbor = spheres.find(s => s.uuid === uuid);
                    if (neighbor && !visited.has(neighbor.uuid)) {
                        stack.push(neighbor);
                    }
                }
            }

            if (group.length >= 2) {
                groups.push(group);
            }


            SuperGeometryMesh.allGroups.push(group);
        }

        return groups;
    }
    updateSphereColorsBasedOnGroups(spheres: SphereWithNeighbors[]) {
        // Спочатку всі — білі
        for (const sphere of spheres) {
            if (sphere.material instanceof THREE.MeshBasicMaterial) {
                sphere.material.color.set(0xff0404);
            }
        }

        this.updateSphereNeighbors(spheres);
        const groups = this.findGroups(spheres);

        for (const group of groups) {
            for (const sphere of group) {
                if (sphere.material instanceof THREE.MeshBasicMaterial) {
                    sphere.material.color.set(0xffff00);
                }
            }
        }
    }
    logGroups(groups: SphereWithNeighbors[][]): void {
        const groupUuids = groups.map(group => group.map(s => s.uuid));
        console.log("Групи UUID:", groupUuids);
    }

    private handleMouseup() {
        if (this.isDragging) {
            this.isDragging = false;
            this.orbitControls.enabled = true;
        }
    }
    Calculate(): IPoint[]{
        let newPoints: IPoint[] = []
        let points: IPoint[] = this.apiData.points!

        for (let j = 0; j < points.length; j++) {
            let Xk = 0
            let Yk = 0
            let Zk = 0

            for (let i = 0; i < 20; i++) {

                let fi = this.Fi(
                    i + 1,
                    points[j].x,
                    points[j].y,
                    points[j].z)

                Xk += this.apiData.defaultComplexPoints![i].x * fi
                Yk += this.apiData.defaultComplexPoints![i].y * fi
                Zk += this.apiData.defaultComplexPoints![i].z * fi
            }

            newPoints.push(
                {x: Xk, y: Yk, z: Zk, globalId: points[j].globalId, localIds: points[j].localIds}
            )
        }
        return newPoints
    }
    Fi(i: number, lk: number, bk: number, gk: number): number{
        let result: number;
        let mul1 = 1 + lk * DEFAULT_POINTS[i - 1].x
        let mul2 = 1 + bk * DEFAULT_POINTS[i - 1].y
        let mul3 = 1 + gk * DEFAULT_POINTS[i - 1].z

        if (i <= 8){
            let mul4 = mul1 + mul2 + mul3  - 5
            result =  1/8 * mul1 * mul2 * mul3 * mul4
        }
        else{
            let df_X_i = DEFAULT_POINTS[i - 1].x
            let df_Y_i = DEFAULT_POINTS[i - 1].y
            let df_Z_i = DEFAULT_POINTS[i - 1].z

            let m1 = Math.pow(lk * df_Y_i * df_Z_i, 2)
            let m2 = Math.pow(bk * df_X_i * df_Z_i, 2)
            let m3 = Math.pow(gk * df_X_i * df_Y_i, 2)

            let mul4 = 1 - m1 - m2 - m3
            result =  1/4 * mul1 * mul2 * mul3 * mul4
        }
        return result
    }
    private initializeDragControls(){

        this.disposeDragControls();

        this.dragControls = new DragControls(
            SuperGeometryMesh.allDefaultSpheres,
            this.camera,
            this.renderer.domElement
        );

        this.isDragging = false;
    }
    private disposeDragControls() {
        if (this.dragControls) {
            this.dragControls.deactivate();
            this.dragControls.dispose();
        }
    }
    public updatePolygonColors(newColor: THREE.Color) {
        const colors = this.geometry.attributes['color'].array;
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = newColor.r;
            colors[i + 1] = newColor.g;
            colors[i + 2] = newColor.b;
        }
        this.geometry.attributes['color'].needsUpdate = true;
    }
    dispose() {
        SuperGeometryMesh.ID--;

        this.defaultSpheres.forEach(sphere => {
            const index = SuperGeometryMesh.allDefaultSpheres.indexOf(sphere);
            if (index !== -1) SuperGeometryMesh.allDefaultSpheres.splice(index, 1);
        })

        const index = SuperGeometryMesh.allMeshes.indexOf(this);
        if (index !== -1) SuperGeometryMesh.allMeshes.splice(index, 1);

        if (this.dragControls) {
            this.dragControls.deactivate();
            this.dragControls.dispose();
        }

        this.AverageCoordinateMarkers.forEach(marker => {
            this.scene.remove(marker);
            if (marker instanceof THREE.Mesh) {
                if (marker.geometry) marker.geometry.dispose();
                if (marker.material) {
                    if (Array.isArray(marker.material)) {
                        marker.material.forEach(mat => mat.dispose());
                    } else {
                        marker.material.dispose();
                    }
                }
            }
        });
        this.AverageCoordinateMarkers = [];


        this.geometry.dispose();
        //console.log("Main geometry disposing:", this.geometry['type']);

        if (Array.isArray(this.material))
            this.material.forEach(mat => {mat.dispose();});
        else
            this.material.dispose();

        this.children.forEach(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
                child.geometry.dispose();

                if (Array.isArray(child.material))
                    child.material.forEach(mat => {mat.dispose();});
                else
                    child.material.dispose();
            }
        });
    }
}

export enum FacePointType {
    NegativeFace_X_Points = "NegativeFace_X_Points",
    NegativeFace_Y_Points = "NegativeFace_Y_Points",
    NegativeFace_Z_Points = "NegativeFace_Z_Points",
    PositiveFace_X_Points = "PositiveFace_X_Points",
    PositiveFace_Y_Points = "PositiveFace_Y_Points",
    PositiveFace_Z_Points = "PositiveFace_Z_Points"
}
export interface SideData {
    facePointType: FacePointType;
    arrayIDs: number[];
    middlePoint: THREE.Vector3;
}
export enum ConnectionType {
    XAxis = 'X-Axis',
    YAxis = 'Y-Axis',
    ZAxis = 'Z-Axis',
}
export interface OppositeSideLink {
    side1: SideData;
    side2: SideData;
    connectionType: ConnectionType;
}
export interface SphereWithNeighbors extends THREE.Mesh {
    userData: {
        globalId: number;
        neighbors?: string[];
    };
}



/*
console.log("neighborSphere( " + neighborSphere.position.x + " " + neighborSphere.position.y + " " + neighborSphere.position.z + ")")
console.log("neighborSphereWorld( " + neighborSphereWorldPosition.x + " " + neighborSphereWorldPosition.y + " " + neighborSphereWorldPosition.z + ")")*/
