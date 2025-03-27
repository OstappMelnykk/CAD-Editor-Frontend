import {CanvasComponent} from '../canvas.component';

export function clickToCreate( this: CanvasComponent, event: MouseEvent, {
                                   setMouse,
                                   createMesh
                                }: {
                                   setMouse: (event: MouseEvent) => void;
                                   createMesh: () => void;
                                }
) : void
{
    if (!event.ctrlKey) return;

    setMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects, false);

    if (intersects.length === 0)
        createMesh();
}
