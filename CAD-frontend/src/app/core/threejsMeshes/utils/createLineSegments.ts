import * as THREE from 'three';
import { IPairOfIndices } from "../../interfaces/api/IPairOfIndices.interface";
import { IPoint } from "../../interfaces/api/IPoint.interface";


export function createLineSegments(
    points: IPoint[],
    pairsOfIndices: IPairOfIndices[],
    lineMaterial: THREE.LineBasicMaterial
) : THREE.LineSegments
{
    const lineGeometry = new THREE.BufferGeometry();

    const vertices: number[] = points.flatMap((point) => [point.x, point.y, point.z]);
    const indices: number[] = pairsOfIndices.flatMap((pair) => [pair.idx1, pair.idx2]);

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    lineGeometry.setIndex(indices);
    lineGeometry.computeVertexNormals();

    return new THREE.LineSegments(lineGeometry, lineMaterial);
}






/* const vertices: number[] = [];
 const indices: number[] = [];

 points.forEach((point) => {
     vertices.push(point.x, point.y, point.z);
 });

 pairsOfIndices.forEach((pair) => {
     indices.push(pair.idx1, pair.idx2);
 });*/
