import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';

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

    /*  divisionService = inject(DivisionService);
    divisionHandlerService = inject(DivisionHandlerService);*/

    /*  private points: IPoint[] = []
      private pairsOfIndices: IPairOfIndices[] = []
      private polygons: IPolygon[] = []*/

    public myForm = new FormGroup({
        x: new FormControl(),
        y: new FormControl(),
        z: new FormControl(),
    })

    public setDefaulForm(){
        this.myForm.get('x')?.setValue(1);
        this.myForm.get('y')?.setValue(1);
        this.myForm.get('z')?.setValue(1);
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

        /*this.divisionService.divide(
            this.myForm.value.x ?? 1,
            this.myForm.value.y ?? 1,
            this.myForm.value.z ?? 1).subscribe({
            next: ({ points, pairsOfIndices, polygons }) => {
                console.log('Points:', points);
                console.log('Pairs of Indices:', pairsOfIndices);
                console.log('Polygons:', polygons);

                this.divisionHandlerService.DivisionOccurs({
                    points: points,
                    pairsOfIndices: pairsOfIndices,
                    polygons: polygons
                });

            },
            error: (error) => {
                console.error('Error:', error);
            }
        });*/
    }
}
