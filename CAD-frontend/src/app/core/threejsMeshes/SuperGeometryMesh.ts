import * as THREE from 'three';
import {IAPIData} from '../interfaces/api/IAPIData.interface';
import { IPoint } from '../interfaces/api/IPoint.interface';
import {ApiService} from '../services/api/api.service';
import {SuperGeometryMeshOptions} from './interfaces/ISuperGeometryMeshOptions.interface';
import {IPosition} from '../interfaces/three-js/IPosition.interface';
import {createDraggableSphere} from './utils/createDraggableSphere';
import {createDefaultSphere} from './utils/createDefaultSphere';
import {createLineSegments} from './utils/createLineSegments';


export class SuperGeometryMesh extends THREE.Mesh {

    static id: number;

    public divisionOptions: {
        x: number,
        y: number,
        z: number,

    } = {
        x: 1,
        y: 1,
        z: 1,
    }

    private dragablePoints: IPoint[] = [];
    private draggablePointsSet!: Set<string>;
    private meshOptions!: SuperGeometryMeshOptions;

    private superCubeGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private superCubeMaterial!: THREE.MeshBasicMaterial;
    private lineSegments!: THREE.LineSegments
    private lineMaterial!: THREE.LineBasicMaterial;



    constructor(private apiService: ApiService) {
        super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
    }


    async createMesh(apiData: IAPIData, options: SuperGeometryMeshOptions): Promise<void> {
        SuperGeometryMesh.id++;
        this.meshOptions = options;

        this.initializeMaterial();
        this.initializeGeometry(apiData, options);

        this.initializeLineSegments(apiData, options);

        await this.loadDraggablePoints();

        this.initializeDraggablePointsSet();
        this.createSpheres(apiData);
    }


    public changeDivisionOptions(x: number, y: number, z: number): void {
        this.divisionOptions.x = x;
        this.divisionOptions.y = y;
        this.divisionOptions.z = z;
    }


    private initializeMaterial(): void {
        this.superCubeMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true,
            wireframe: this.meshOptions.wireframe,
            transparent: true,
            opacity: this.meshOptions.opacity,
            depthWrite: this.meshOptions.depthWrite,
            depthTest: this.meshOptions.depthTest,
        });
    }

    private initializeGeometry(apiData: IAPIData, options: SuperGeometryMeshOptions): void {
        const vertices = this.extractVertices(apiData);
        const indices = this.extractIndices(apiData);
        const colors = this.generateColors(apiData, options);

        this.superCubeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.superCubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const correctedIndices = this.ensureOutwardNormals(apiData.points!, indices);
        this.superCubeGeometry.setIndex(correctedIndices);
        this.superCubeGeometry.computeVertexNormals();

        this.geometry = this.superCubeGeometry;
        this.material = this.superCubeMaterial;
    }

    private extractVertices(apiData: IAPIData): number[] {
        return apiData.points!.flatMap((point) => [point.x, point.y, point.z]);
    }

    private extractIndices(apiData: IAPIData): number[] {
        return apiData.polygons!.flatMap((polygon) => [polygon.idx1, polygon.idx2, polygon.idx3]);
    }

    private generateColors(apiData: IAPIData, options: SuperGeometryMeshOptions): number[] {
        return apiData.polygons!.flatMap(() => {
            const color = options.colors.defaultColor;
            return [color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b];
        });
    }


    private initializeLineSegments(apiData: IAPIData, options: SuperGeometryMeshOptions): void {
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: options.colors.linesegmentsDefaultColor,
        });

        this.lineSegments = createLineSegments(apiData.points!, apiData.pairsOfIndices!, this.lineMaterial);
        this.add(this.lineSegments);
    }

    async loadDraggablePoints(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.apiService.Default_Points().subscribe({
                next: (points) => {
                    this.dragablePoints = points;
                    resolve();
                },
                error: (err) => {
                    console.error('Сталася помилка в SuperGeometryMesh -> get_dragable_points:', err);
                    reject(err);
                },
                complete: () => {
                    console.log('Запит draggable точок завершено.');
                },
            });
        });
    }


    private initializeDraggablePointsSet(): void {
        this.draggablePointsSet = new Set(
            this.dragablePoints.map((point) => `${point.x},${point.y},${point.z}`)
        );
    }



    private createSpheres(apiData: IAPIData): void {
        apiData.points!.forEach((point) => {
            const position: IPosition = { x: point.x, y: point.y, z: point.z };
            const pointKey = `${point.x},${point.y},${point.z}`;

            const sphere = this.draggablePointsSet.has(pointKey)
                ? createDraggableSphere(position, this.meshOptions.colors.sphereDraggableColor)
                : createDefaultSphere(position, this.meshOptions.colors.sphereDefaultColor);

            this.add(sphere);
        });
    }


    private ensureOutwardNormals(points: IPoint[], polygonIndices: number[]): number[] {
        const correctedIndices: number[] = [];

        const centroid = new THREE.Vector3();
        points.forEach((point) => {
            centroid.add(new THREE.Vector3(point.x, point.y, point.z));
        });
        centroid.divideScalar(points.length);

        for (let i = 0; i < polygonIndices.length; i += 3) {
            const idx1 = polygonIndices[i];
            const idx2 = polygonIndices[i + 1];
            const idx3 = polygonIndices[i + 2];

            const p1 = new THREE.Vector3(points[idx1].x, points[idx1].y, points[idx1].z);
            const p2 = new THREE.Vector3(points[idx2].x, points[idx2].y, points[idx2].z);
            const p3 = new THREE.Vector3(points[idx3].x, points[idx3].y, points[idx3].z);

            const normal = new THREE.Vector3().crossVectors(
                new THREE.Vector3().subVectors(p2, p1),
                new THREE.Vector3().subVectors(p3, p1)
            ).normalize();

            const toCentroid = new THREE.Vector3().subVectors(p1, centroid);
            if (normal.dot(toCentroid) < 0) {
                correctedIndices.push(idx1, idx3, idx2);
            } else {
                correctedIndices.push(idx1, idx2, idx3);
            }
        }

        return correctedIndices;
    }




    dispose() {
        SuperGeometryMesh.id--;
        this.geometry.dispose();
        console.log("Main geometry disposing:", this.geometry['type']);

        if (Array.isArray(this.material)) {
            this.material.forEach(mat => {
                mat.dispose();
                console.log("Main geometry material disposing:", mat['type']);
            });
        } else {
            this.material.dispose();
            console.log("Main geometry material disposing:", this.material['type']);
        }

        // Dispose children
        this.children.forEach(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
                child.geometry.dispose();
                console.log(`Child geometry disposing (${child.constructor.name}):`, child.geometry['type']);

                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.dispose();
                        console.log(`Child material disposing (${child.constructor.name}):`, mat['type']);
                    });
                } else {
                    child.material.dispose();
                    console.log(`Child material disposing (${child.constructor.name}):`, child.material['type']);
                }
            }
        });
    }
}
