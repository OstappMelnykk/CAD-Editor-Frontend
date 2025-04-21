import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ColorPickerDirective} from 'ngx-color-picker';
import {DivisionEventService} from '../../../../../../core/services/state/division-event.service';
import {ColorsEventService} from '../../../../../../core/services/state/colors-event.service';
import {IDivisionConfig} from '../../../../../../core/interfaces/api/IDivisionConfig';

@Component({
    selector: 'app-design',
    standalone: true,

    imports: [
        ReactiveFormsModule,
        ColorPickerDirective
    ],
    templateUrl: './design.component.html',
    styleUrl: './design.component.scss'
})
export class DesignComponent {
    title = 'Color Picker Settings';
    settingsEnum = ColorSettings;
    settingsForm: FormGroup;

    constructor(private fb: FormBuilder, private colorsEvent: ColorsEventService,) {
        this.settingsForm = this.fb.group({
            [ColorSettings.DefaultMeshColor]: ['#fff'],
            [ColorSettings.HoverMeshColor]: ['#fff'],
            [ColorSettings.ActiveMeshColor]: ['#fff'],
            [ColorSettings.WireframeColor]: ['#fff'],
            [ColorSettings.DefaultSphereColor]: ['#fff'],
            [ColorSettings.DraggableSphereColor]: ['#fff'],
            [ColorSettings.MeshOpacity]: [0.1]
        });
    }

    /*ngOnInit(): void {
        Object.keys(this.settingsForm.controls).forEach((controlName) => {
            this.settingsForm.get(controlName)?.valueChanges.subscribe((newValue: any) => {
                console.log(`${controlName}: Нове значення - ${newValue}`);
                (this as any)[controlName] = newValue;
            });
        });
    }*/

    ngOnInit(): void {
        // Слухач змін для кожного поля
        Object.keys(this.settingsForm.controls).forEach((controlName) => {
            this.settingsForm.get(controlName)?.valueChanges.subscribe((newValue) => {
                console.log(`${controlName}: Нове значення - ${newValue}`);
                this.handleSettingChange(controlName as ColorSettings, newValue);
            });
        });
    }


    handleSettingChange(setting: ColorSettings, value: string | number): void {
        switch (setting) {
            case ColorSettings.DefaultMeshColor:
                this.colorsEvent.ChangeDefaultMeshColor(value as string);
                break;
            case ColorSettings.HoverMeshColor:
                this.colorsEvent.ChangeHoverMeshColor(value as string);
                break;
            case ColorSettings.ActiveMeshColor:
                this.colorsEvent.ChangeActiveMeshColor(value as string);
                break;
            case ColorSettings.WireframeColor:
                this.colorsEvent.ChangeWireframeColor(value as string);
                break;
            case ColorSettings.DefaultSphereColor:
                this.colorsEvent.ChangeDefaultSphereColor(value as string);
                break;
            case ColorSettings.DraggableSphereColor:
                this.colorsEvent.ChangeDraggableSphereColor(value as string);
                break;
            case ColorSettings.MeshOpacity:
                this.colorsEvent.ChangeMeshOpacity(+value); // Перетворення в число
                break;
        }
    }

    onColorChange(setting: ColorSettings, newColor: string): void {
        console.log(`colorPickerChange: ${setting} - Новий колір: ${newColor}`);
        this.settingsForm.get(setting)?.setValue(newColor, { emitEvent: false });
    }

    onOpacityChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const newOpacity = parseFloat(inputElement.value);
        console.log(`meshOpacity: Нове значення - ${newOpacity}`);
        this.settingsForm.get(ColorSettings.MeshOpacity)?.setValue(newOpacity);
    }



  /*  onColorChange(field: string, newColor: string): void {
        console.log(`colorPickerChange: ${field} - Новий колір: ${newColor}`);
       /!* this.colorsEvent.
        this.divisionEvent.DivisionOccurs(divisionRequest as IDivisionConfig);*!/
        this.settingsForm.get(field)?.setValue(newColor, { emitEvent: false }); // Оновлюємо форму
    }*/


    /*ChangeDefaultMeshColor(defaultMeshColor: string)
    ChangeHoverMeshColor(hoverMeshColor: string)
    ChangeActiveMeshColor(activeMeshColor: string): void {th
    ChangeWireframeColor(wireframeColor: string): void {this
    ChangeDefaultSphereColor(defaultSphereColor: string): vo
    ChangeDraggableSphereColor(draggableSphereColor: string)
    ChangeMeshOpacity(meshOpacity: number): void {this.meshO*/

   /* onOpacityChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const newOpacity = parseFloat(inputElement.value);
        console.log(`meshOpacity: Нове значення - ${newOpacity}`);
        this.meshOpacity = newOpacity;
        this.settingsForm.get('meshOpacity')?.setValue(newOpacity);
    }*/
}

export enum ColorSettings {
    DefaultMeshColor = 'defaultMeshColor',
    HoverMeshColor = 'hoverMeshColor',
    ActiveMeshColor = 'activeMeshColor',
    WireframeColor = 'wireframeColor',
    DefaultSphereColor = 'defaultSphereColor',
    DraggableSphereColor = 'draggableSphereColor',
    MeshOpacity = 'meshOpacity'
}
