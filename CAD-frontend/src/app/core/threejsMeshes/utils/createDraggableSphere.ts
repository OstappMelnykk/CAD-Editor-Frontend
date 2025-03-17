import * as THREE from 'three';
import {IPosition} from '../../interfaces/three-js/IPosition.interface';


export function createDraggableSphere(position: IPosition,
                               materialColor: THREE.Color): THREE.Mesh {

    const sphereDraggableGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const sphereDraggableMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: materialColor
    });

    const draggableSphereMesh = new THREE.Mesh(sphereDraggableGeometry, sphereDraggableMaterial);

    draggableSphereMesh.position.set(
        position.x,
        position.y,
        position.z
    )

    draggableSphereMesh.userData['isDraggable'] = true;
    draggableSphereMesh.userData['DefaultPosition'] = {
        x: position.x,
        y: position.y,
        z: position.z
    } as IPosition;

    return draggableSphereMesh
}

