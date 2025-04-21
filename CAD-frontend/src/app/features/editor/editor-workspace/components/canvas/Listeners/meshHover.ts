import * as THREE from 'three';
import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {CanvasComponent} from '../canvas.component';

export function meshHover(this: CanvasComponent,
                          event: MouseEvent,
                          {setMouse} : { setMouse: (event: MouseEvent) => void }
):  {intersectedPoint: THREE.Vector3; directionVector: THREE.Vector3} | null {

    setMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const pickableObjects = this.objectManager.getPickableObjects();

    const objectToExclude = this.activeObject;

    const filteredPickableObjects = pickableObjects.filter(
        object => object !== objectToExclude
    );

    const intersects = this.raycaster.intersectObjects(filteredPickableObjects, false);


    if (this.hoveredObject &&
        this.hoveredObject !== this.activeObject &&
        this.hoveredObject instanceof SuperGeometryMesh)
    {
        this.hoveredObject.updatePolygonColors(this.hoveredObject.meshColors.defaultMeshColor);
    }

    if (intersects.length > 0 &&
        intersects[0].object instanceof SuperGeometryMesh &&
        intersects[0].object !== this.activeObject)
    {
        const mesh = intersects[0].object as SuperGeometryMesh;
        mesh.updatePolygonColors(mesh.meshColors.hoverMeshColor);
        this.hoveredObject = mesh;

        const directionVector = new THREE.Vector3()
        directionVector.copy((intersects[0].face as THREE.Face).normal)

        const intersectedPoint = intersects[0].point; // Точка перетину (x, y, z)
        return {intersectedPoint: intersectedPoint, directionVector: directionVector}
    }
    else
    {
        this.hoveredObject = null;
        return null
    }
}
