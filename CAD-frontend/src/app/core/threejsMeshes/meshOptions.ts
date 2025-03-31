import {SuperGeometryMeshOptions} from './interfaces/ISuperGeometryMeshOptions.interface';
import * as THREE from 'three';
import {IMeshColors} from './interfaces/IMeshColors.interface';

export const meshOptions = {
    colors: {
        defaultMeshColor: new THREE.Color('#5a8be2'),
        hoverMeshColor: new THREE.Color('rgba(0,89,255,0.61)'),
        //hoverMeshColor: new THREE.Color('rgba(1,22,66,0.61)'),
        activeMeshColor: new THREE.Color('rgba(255,4,4,0.7)'),
        wireframeColor: new THREE.Color(0xbfc2c7),
        defaultSphereColor: new THREE.Color(0xbfc2c7),
        draggableSphereColor: new THREE.Color('rgba(255,4,4)')
    } as IMeshColors,

    wireframeOpacity: 0.2,
    wireframe: false,
    depthWrite: false,
    depthTest: true,
} as SuperGeometryMeshOptions
