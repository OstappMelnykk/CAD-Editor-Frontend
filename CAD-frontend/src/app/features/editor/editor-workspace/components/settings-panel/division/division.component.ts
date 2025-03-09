import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {IDivisionRequest} from '../../../../../../core/models/DTOs/IDivisionRequest.interface';
import {ApiService} from '../../../../../../core/services/api/api.service';
import {forkJoin} from 'rxjs';
import {IAPIData} from '../../../../../../core/interfaces/api/IAPIData.interface';
import {DivisionEventService} from '../../../../../../core/services/state/division-event.service';
import {SuperGeometryMesh} from '../../../../../../core/threejsMeshes/SuperGeometryMesh';
import * as THREE from 'three';
import {GlobalVariablesService} from '../../../../../../core/services/three-js/global-variables.service';
import {
    SuperGeometryMeshOptions
} from '../../../../../../core/threejsMeshes/interfaces/ISuperGeometryMeshOptions.interface';
import {IMeshColors} from '../../../../../../core/threejsMeshes/interfaces/IMeshColors.interface';
@Component({
    selector: 'app-division',
    standalone: true,

    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './division.component.html',
    styleUrl: './division.component.scss'
})
export class DivisionComponent {
    title: string = 'Division';

    constructor(private apiService: ApiService,
                private divisionEvent: DivisionEventService,
                private globalVariablesService: GlobalVariablesService)
    {}

    public myForm = new FormGroup({
        x: new FormControl(),
        y: new FormControl(),
        z: new FormControl(),
    })

    public setDefaulForm(){
        this.myForm.get('x')?.setValue(2);
        this.myForm.get('y')?.setValue(2);
        this.myForm.get('z')?.setValue(2);
    }

    public handleValue()
    {
        let IsValid: boolean = true;

        if (this.myForm.value.x === null ||
            !Number.isInteger(this.myForm.value.x) ||
            this.myForm.value.x <= 0)
        {
            this.myForm.get('x')?.setValue(1);
            IsValid = false;
        }

        if (this.myForm.value.y === null || !Number.isInteger(this.myForm.value.y) || this.myForm.value.y <= 0) {
            this.myForm.get('y')?.setValue(1);
            IsValid = false;
        }

        if (this.myForm.value.z === null || !Number.isInteger(this.myForm.value.z) || this.myForm.value.z <= 0) {
            this.myForm.get('z')?.setValue(1);
            IsValid = false;
        }

        if(!IsValid) alert("form is not valied. use default values")


        let divisionRequest: IDivisionRequest = {
             x: this.myForm.value.x,
             y: this.myForm.value.y,
             z: this.myForm.value.z,
        }

        this.apiService.Divide(divisionRequest).subscribe({
            next: () => {
                forkJoin({
                    points: this.apiService.Points(),
                    pairsOfIndices: this.apiService.PairsOfIndices(),
                    polygons: this.apiService.Polygons()
                }).subscribe((apiData: IAPIData) => {
                    console.log('Дані зібрані з усіх запитів:', apiData);

                    this.divisionEvent.DivisionOccurs(apiData);

                    const superGeometryMesh = new SuperGeometryMesh(this.apiService);
                    superGeometryMesh.createMesh(
                        apiData,
                        {
                            colors: {
                                defaultColor: new THREE.Color('#5a8be2'),
                                hoverColor: new THREE.Color('rgba(255,4,4,0.7)'),
                                activeColor: new THREE.Color('rgba(0,89,255,0.61)'),
                                linesegmentsDefaultColor: new THREE.Color(0xbfc2c7),
                                sphereDefaultColor: new THREE.Color(0xbfc2c7),
                                sphereDraggableColor: new THREE.Color('rgba(255,4,4)')
                            } as IMeshColors,

                            opacity: 0.2,
                            wireframe: false,
                            depthWrite: false,
                            depthTest: true,
                        } as SuperGeometryMeshOptions
                    )

                    let scene = this.globalVariablesService.get('scene') as THREE.Scene;
                    scene.add(superGeometryMesh);


                });
            },
            error: (err) => {
                console.error('Помилка під час виконання Divide:', err);
            }
        });
    }
}










/* const superGeometryMesh = new SuperGeometryMesh(
     this.apiService,
     apiData,
     {
         colors: {
             defaultColor: new THREE.Color('#5a8be2'),
             hoverColor: new THREE.Color('rgba(255,4,4,0.7)'),
             activeColor: new THREE.Color('rgba(0,89,255,0.61)'),
             linesegmentsDefaultColor: new THREE.Color(0xbfc2c7),
             sphereDefaultColor: new THREE.Color(0xbfc2c7),
             sphereDraggableColor: new THREE.Color(0xbfc2c7)
         } as IMeshColors,

         opacity: 0.2,
         wireframe: false,
         depthWrite: false,
         depthTest: true,
     } as SuperGeometryMeshOptions

 )
*/
