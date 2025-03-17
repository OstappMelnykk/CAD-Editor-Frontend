import * as THREE from 'three';
import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {meshOptions} from '../../../../../../core/threejsMeshes/meshOptions';
import {CanvasComponent} from '../canvas.component';
import {HoverEffectHandler} from '../interfaces/HoverEffectHandler';

export function meshHover(this: CanvasComponent,
                          event: MouseEvent,
                          {   setMouse,
                              raycaster,
                              mouse,
                              camera,
                              pickablesObjects } : HoverEffectHandler
): void {

    setMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pickablesObjects, false);

    if (this.hoveredObject &&
        this.hoveredObject !== this.activeMesh &&
        this.hoveredObject instanceof SuperGeometryMesh)
    {
        this.hoveredObject.updatePolygonColors(meshOptions.colors.defaultColor);
    }

    if (intersects.length > 0 &&
        intersects[0].object instanceof SuperGeometryMesh &&
        intersects[0].object !== this.activeMesh)
    {
        const mesh = intersects[0].object as SuperGeometryMesh;
        mesh.updatePolygonColors(meshOptions.colors.hoverColor);
        this.hoveredObject = mesh;
    }
    else
    {
        this.hoveredObject = null;
    }
}
