import * as THREE from 'three';
import {IPosition} from '../../interfaces/three-js/IPosition.interface';


export function createDefaultSphere(
    position: IPosition,
    color: THREE.Color,
    globalId: number,
    localIds: number[]
): THREE.Mesh
{

    const sphereDefaultGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.016, 32, 32);
    const sphereDefaultMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: color
    });

    const defaultSphereMesh = new THREE.Mesh(sphereDefaultGeometry, sphereDefaultMaterial);

    defaultSphereMesh.position.set(
        position.x,
        position.y,
        position.z
    )

    defaultSphereMesh.userData['isDraggable'] = false;
    defaultSphereMesh.userData['globalId'] = globalId;
    defaultSphereMesh.userData['localIds'] = localIds;
    defaultSphereMesh.userData['defaultPosition'] = {
        x: position.x,
        y: position.y,
        z: position.z
    };

    return defaultSphereMesh
}
