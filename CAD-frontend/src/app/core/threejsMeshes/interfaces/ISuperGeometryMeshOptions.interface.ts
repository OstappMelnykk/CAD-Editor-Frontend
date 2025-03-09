import {IMeshColors} from './IMeshColors.interface';


export interface SuperGeometryMeshOptions {
    colors: IMeshColors;
    opacity: number;
    wireframe: boolean;
    depthWrite: boolean;
    depthTest: boolean;
}


/*
?? {
            colors: {
                defaultColor: new THREE.Color('#5a8be2'),
                hoverColor: new THREE.Color('rgba(255,4,4,0.7)'),
                activeColor: new THREE.Color('rgba(0,89,255,0.61)'),
                linesegmentsDefaultColor: new THREE.Color(0xbfc2c7),
                sphereDefaultColor: new THREE.Color(0xbfc2c7),
                sphereDraggableColor: new THREE.Color(0xbfc2c7)
            } as IMeshColors,

            opacity: 0.2,
            wireframe: false,
            depthWrite: false,
            depthTest: true,
        }

*/
