import {IMeshColors} from './IMeshColors.interface';


export interface SuperGeometryMeshOptions {
    colors: IMeshColors;
    mehsOpacity: number;
    wireframeOpacity: number;
    wireframe: boolean;
    depthWrite: boolean;
    depthTest: boolean;
}
