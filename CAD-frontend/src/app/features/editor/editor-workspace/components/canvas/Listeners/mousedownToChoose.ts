import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {meshOptions} from '../../../../../../core/threejsMeshes/meshOptions';
import {CanvasComponent} from '../canvas.component';

export function mousedownToChoose(this: CanvasComponent,
                                  event: MouseEvent,
                                  {setMouse} : {  setMouse: (event: MouseEvent) => void; }
) : void
{
    if (event.ctrlKey) return;

    setMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects, false);

    const activeMesh: SuperGeometryMesh | null = this.activeObject ?? null;

    if (intersects.length === 0) {
        if (activeMesh) {
            activeMesh.updatePolygonColors(meshOptions.colors.defaultMeshColor);
            this.activeObject = null;
        }
        return;
    }

    const clickedObject = intersects[0].object;

    if (clickedObject instanceof SuperGeometryMesh) {
        const clickedMesh = clickedObject as SuperGeometryMesh;

        if (activeMesh && activeMesh !== clickedMesh)
            activeMesh.updatePolygonColors(meshOptions.colors.defaultMeshColor);

        if (activeMesh === clickedMesh)
            clickedMesh.updatePolygonColors;
        else {
            clickedMesh.updatePolygonColors(meshOptions.colors.activeMeshColor);
            this.activeObject = clickedMesh;
        }
    }
}
