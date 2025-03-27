import * as THREE from 'three';
import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {meshOptions} from '../../../../../../core/threejsMeshes/meshOptions';
import {CanvasComponent} from '../canvas.component';

export function meshHover(this: CanvasComponent,
                          event: MouseEvent,
                          {setMouse} : { setMouse: (event: MouseEvent) => void }
):  THREE.Vector3 | null {

    setMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects, false);

    if (this.hoveredObject &&
        this.hoveredObject !== this.activeObject &&
        this.hoveredObject instanceof SuperGeometryMesh)
    {
        this.hoveredObject.updatePolygonColors(meshOptions.colors.defaultMeshColor);
    }

    if (intersects.length > 0 &&
        intersects[0].object instanceof SuperGeometryMesh &&
        intersects[0].object !== this.activeObject)
    {
        const mesh = intersects[0].object as SuperGeometryMesh;
        mesh.updatePolygonColors(meshOptions.colors.hoverMeshColor);
        this.hoveredObject = mesh;



        const intersectedPoint = intersects[0].point; // Точка перетину (x, y, z)
        return intersectedPoint
    }
    else
    {
        this.hoveredObject = null;
        return null
    }
}
