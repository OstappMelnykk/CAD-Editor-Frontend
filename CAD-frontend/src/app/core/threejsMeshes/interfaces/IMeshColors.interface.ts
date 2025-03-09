import * as THREE from 'three';

export interface IMeshColors {
    defaultColor: THREE.Color,
    hoverColor: THREE.Color,
    activeColor: THREE.Color,

    linesegmentsDefaultColor: THREE.Color,
    sphereDefaultColor: THREE.Color,
    sphereDraggableColor: THREE.Color,
}
