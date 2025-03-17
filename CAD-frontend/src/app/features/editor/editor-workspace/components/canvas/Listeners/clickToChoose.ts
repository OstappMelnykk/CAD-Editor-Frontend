import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {meshOptions} from '../../../../../../core/threejsMeshes/meshOptions';
import {CanvasComponent} from '../canvas.component';
import {ChooseHandler} from '../interfaces/ChooseHandler';

export function clickToChoose(this: CanvasComponent,
                              event: MouseEvent, {
                              setMouse,
                              raycaster,
                              mouse,
                              camera,
                              pickablesObjects } : ChooseHandler
) : void
{
    if (event.ctrlKey) return;

    setMouse(event);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pickablesObjects, false);

    const activeMesh: SuperGeometryMesh | null = this.activeMesh ?? null;

    if (intersects.length === 0) {
        if (activeMesh) {
            activeMesh.updatePolygonColors(meshOptions.colors.defaultColor);
            this.activeMesh = null;
        }
        return;
    }

    const clickedObject = intersects[0].object;

    if (clickedObject instanceof SuperGeometryMesh) {
        const clickedMesh = clickedObject as SuperGeometryMesh;

        if (activeMesh && activeMesh !== clickedMesh)
            activeMesh.updatePolygonColors(meshOptions.colors.defaultColor);

        if (activeMesh === clickedMesh)
            clickedMesh.updatePolygonColors;
        else {
            clickedMesh.updatePolygonColors(meshOptions.colors.activeColor);
            this.activeMesh = clickedMesh;
        }
    }
}
