import * as THREE from 'three';
import {IPosition} from '../../interfaces/three-js/IPosition.interface';


export function createDraggableSphere(
    position: IPosition,
    color: THREE.Color,
    globalId: number,
    localIds: number[]
): THREE.Mesh
{
    const sphereDraggableGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const sphereDraggableMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: color
    });

    const draggableSphereMesh = new THREE.Mesh(sphereDraggableGeometry, sphereDraggableMaterial);

    draggableSphereMesh.position.set(
        position.x,
        position.y,
        position.z
    )

    draggableSphereMesh.userData['isDraggable'] = true;
    draggableSphereMesh.userData['globalId'] = globalId;
    draggableSphereMesh.userData['localIds'] = localIds;
    draggableSphereMesh.userData['defaultPosition'] = {
        x: position.x,
        y: position.y,
        z: position.z
    };

    return draggableSphereMesh
}

