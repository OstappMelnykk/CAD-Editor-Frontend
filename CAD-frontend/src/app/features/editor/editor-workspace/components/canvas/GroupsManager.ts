import * as THREE from 'three';
import {SuperGeometryMesh} from '../../../../../core/threejsMeshes/SuperGeometryMesh';

export class GroupsManager {
    private scene: THREE.Scene;
    private groups: Map<number, string[]> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public addToGroup(uuid: string){}
    public removeFromGroup(uuid: string){}
    public getGroups(){}
    public defineGroup(uuid: string){}
    public getGroupMembers(groupIndex: number){}
}
