import {SuperGeometryMesh} from '../../../../../core/threejsMeshes/SuperGeometryMesh';
import * as THREE from 'three';
import {DragControls} from 'three/examples/jsm/controls/DragControls.js';



export class ObjectManager {
    private scene: THREE.Scene;
    private groups: Map<string, THREE.Group> = new Map();
    private meshes: Map<string, SuperGeometryMesh> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    addMesh(mesh: SuperGeometryMesh): void {
        const group = new THREE.Group();
        group.add(mesh);
        this.scene.add(group);
        this.groups.set(mesh.uuid, group);
        this.meshes.set(mesh.uuid, mesh);
    }



    removeMesh(mesh: SuperGeometryMesh): void {
        const group = this.groups.get(mesh.uuid);
        if (group) {
            this.scene.remove(group);
            this.groups.delete(mesh.uuid);
        }
        this.meshes.delete(mesh.uuid);
        mesh.dispose();
    }

    getPickableObjects(): THREE.Object3D[] {
        return Array.from(this.meshes.values());
    }

    getGroups(): THREE.Group[] {
        return Array.from(this.groups.values());
    }

    clearAll(): void {
        this.meshes.forEach(mesh => this.removeMesh(mesh));
    }
}
