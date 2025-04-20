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
import {forkJoin, Subject} from 'rxjs';
import {IPairOfIndices} from '../interfaces/api/IPairOfIndices.interface';
import {IPolygon} from '../interfaces/api/IPolygon.interface';



export class SuperGeometryMesh extends THREE.Mesh {
    static ID = 0;

    private readonly meshColors: IMeshColors = {
        defaultMeshColor: new THREE.Color('#5a8be2'),
        hoverMeshColor: new THREE.Color('rgba(0,89,255)'),  //rgba(0,89,255,0.61)
        activeMeshColor: new THREE.Color('rgba(255,4,4)'),  //rgba(255,4,4,0.7)
        wireframeColor: new THREE.Color(0xbfc2c7),
        defaultSphereColor: new THREE.Color(0xbfc2c7),
        draggableSphereColor: new THREE.Color('rgba(255,4,4)'),
    }

    readonly materialOptions: IMaterialOptions = {
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

    apiData!: IAPIData;

    private spheres: THREE.Object3D[] = [];
    private defaultSpheres: THREE.Object3D[] = [];


    public draggablePointIndex: number = -1;
    public isDragging = false;

    private apiDataLoaded$ = new Subject<void>();



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
        });



        // this.initializeMaterial();
        // this.initializeGeometry();
        // this.createSpheres();
        // if(DefaultPoints) this.setDefaultPoints(DefaultPoints)


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

        if (this.defaultSpheres.length > 0)
            this.addDragControls();
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
        if (!this.defaultSpheres.includes(event.object)) return;
        this.isDragging = true;
        this.orbitControls.enabled = false;
        this.outerDragControls.enabled = false;

        const sphere = event.object as THREE.Mesh;
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

        if (!this.isDragging) return;
        if ((this as any).draggingSphere !== event.object) return;
        if (this.draggablePointIndex === -1) return;
        const sphere = event.object as THREE.Mesh;

        this.apiData.defaultComplexPoints![this.draggablePointIndex].x = sphere.position.x;
        this.apiData.defaultComplexPoints![this.draggablePointIndex].y = sphere.position.y;
        this.apiData.defaultComplexPoints![this.draggablePointIndex].z = sphere.position.z;

        this.setNewCalculatedPoints();

        /*const newPoints = this.Calculate();

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
        this.geometry.computeVertexNormals();*/
    }

    private handleDragEnd(event: { object: THREE.Object3D } & THREE.Event<"dragend", DragControls>): void {
        this.isDragging = false;
        this.orbitControls.enabled = true;
        this.outerDragControls.enabled = true;
        if ((this as any).draggingSphere !== event.object) return;

        const sphere = event.object as THREE.Mesh;
        sphere.scale.set(1, 1, 1);
        (this as any).draggingSphere = null;


        let draggedObjectMesh = this as SuperGeometryMesh;
        if (!Array.isArray(draggedObjectMesh.material)) {
            draggedObjectMesh.material.transparent = true;
            draggedObjectMesh.material.opacity = 0.2;
        }
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
            this.defaultSpheres,
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


    dispose()
    {
        SuperGeometryMesh.ID--;

        if (this.dragControls) {
            this.dragControls.deactivate();
            this.dragControls.dispose();
        }

        this.geometry.dispose();
        console.log("Main geometry disposing:", this.geometry['type']);

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


