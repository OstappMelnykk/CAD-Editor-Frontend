import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

export interface IGlobalVariables {
    canvas: HTMLCanvasElement | null,
    scene: THREE.Scene | null,
    camera: THREE.PerspectiveCamera | null,
    renderer: THREE.WebGLRenderer | null,
    orbitControls: OrbitControls | null
}
