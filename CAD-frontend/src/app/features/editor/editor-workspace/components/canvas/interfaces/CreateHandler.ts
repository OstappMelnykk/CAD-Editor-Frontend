import * as THREE from 'three';

export interface CreateHandler {
    setMouse: (event: MouseEvent) => void;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    camera: THREE.Camera;
    pickablesObjects: THREE.Object3D[];
    createMesh: () => void;
}
