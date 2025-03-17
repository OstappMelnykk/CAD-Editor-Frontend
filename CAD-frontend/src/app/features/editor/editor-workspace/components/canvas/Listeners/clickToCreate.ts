import * as THREE from 'three';
import {CreateHandler} from '../interfaces/CreateHandler';

export function clickToCreate( event: MouseEvent,
                               {
                                   setMouse,
                                   raycaster,
                                   mouse,
                                   camera,
                                   pickablesObjects,
                                   createMesh
                               } : CreateHandler
) : void
{
    if (!event.ctrlKey) return;

    setMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pickablesObjects, false);

    if (intersects.length === 0)
        createMesh();
}
