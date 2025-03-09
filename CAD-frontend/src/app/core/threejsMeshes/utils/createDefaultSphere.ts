import * as THREE from 'three';
import {IPosition} from '../../interfaces/three-js/IPosition.interface';


export function createDefaultSphere(position: IPosition,
                             materialColor: THREE.Color):
    THREE.Mesh
{

    const sphereDefaultGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.02, 32, 32);
    const sphereDefaultMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: materialColor
    });

    const defaultSphereMesh = new THREE.Mesh(sphereDefaultGeometry, sphereDefaultMaterial);

    defaultSphereMesh.position.set(
        position.x,
        position.y,
        position.z
    )
    return defaultSphereMesh
}
