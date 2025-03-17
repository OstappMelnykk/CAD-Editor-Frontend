import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {IDivisionRequest} from '../../../../../../core/models/DTOs/IDivisionRequest.interface';
import {ApiService} from '../../../../../../core/services/api/api.service';
import {forkJoin} from 'rxjs';
import {IAPIData} from '../../../../../../core/interfaces/api/IAPIData.interface';
import {DivisionEventService} from '../../../../../../core/services/state/division-event.service';
import {GlobalVariablesService} from '../../../../../../core/services/three-js/global-variables.service';

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
                    this.divisionEvent.DivisionOccurs(apiData);
                });
            },
            error: (err) => {
                console.error('Error while execution Divide:', err);
            }
        });
    }
}
