import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import {CanvasComponent} from '../canvas.component';

export function mousedownToChoose(this: CanvasComponent,
                                  event: MouseEvent,
                                  {setMouse} : {  setMouse: (event: MouseEvent) => void; }
) : void
{
    if (event.ctrlKey) return;

    setMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const pickableObjects = this.objectManager.getPickableObjects();
    const intersects = this.raycaster.intersectObjects(pickableObjects, false);


    const activeMesh: SuperGeometryMesh | null = this.activeObject ?? null;

    if (intersects.length === 0) {
        if (activeMesh) {
            activeMesh.updatePolygonColors(activeMesh.meshColors.defaultMeshColor);
            this.activeObject = null;
        }
        return;
    }

    const clickedObject = intersects[0].object;

    if (clickedObject instanceof SuperGeometryMesh) {
        const clickedMesh = clickedObject as SuperGeometryMesh;

        if (activeMesh && activeMesh !== clickedMesh)
            activeMesh.updatePolygonColors(activeMesh.meshColors.defaultMeshColor);

        if (activeMesh === clickedMesh)
            clickedMesh.updatePolygonColors;
        else {
            clickedMesh.updatePolygonColors(clickedMesh.meshColors.activeMeshColor);
            this.activeObject = clickedMesh;
        }
    }
}
