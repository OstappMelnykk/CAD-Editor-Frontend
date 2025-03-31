import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ColorPickerDirective} from 'ngx-color-picker';

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

    // Динамічні змінні для кольорів
    defaultMeshColor: string = '#fff';
    hoverMeshColor: string = '#fff';
    activeMeshColor: string = '#fff';
    wireframeColor: string = '#fff';
    defaultSphereColor: string = '#fff';
    draggableSphereColor: string = '#fff';

    meshOpacity: number = 0.5;


    settingsForm: FormGroup;

    constructor(private fb: FormBuilder) {
        // Ініціалізуємо значення кожного поля в формі
        this.settingsForm = this.fb.group({
            defaultMeshColor: [this.defaultMeshColor],
            hoverMeshColor: [this.hoverMeshColor],
            activeMeshColor: [this.activeMeshColor],
            wireframeColor: [this.wireframeColor],
            defaultSphereColor: [this.defaultSphereColor],
            draggableSphereColor: [this.draggableSphereColor],
            meshOpacity: [this.meshOpacity] // Додаємо контрол для mesh opacity
        });
    }

    ngOnInit(): void {
        // Відслідковування змін для кожного поля
        Object.keys(this.settingsForm.controls).forEach((controlName) => {
            this.settingsForm.get(controlName)?.valueChanges.subscribe((newValue: any) => {
                console.log(`${controlName}: Нове значення - ${newValue}`);
                (this as any)[controlName] = newValue; // Оновлюємо локальну змінну
            });
        });
    }

    onColorChange(field: string, newColor: string): void {
        console.log(`colorPickerChange: ${field} - Новий колір: ${newColor}`);
        this.settingsForm.get(field)?.setValue(newColor, { emitEvent: false }); // Оновлюємо форму
    }

    // Відслідковування змін прозорості
    onOpacityChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement; // Приведення до HTMLInputElement
        const newOpacity = parseFloat(inputElement.value); // Отримуємо значення
        console.log(`meshOpacity: Нове значення - ${newOpacity}`);
        this.meshOpacity = newOpacity; // Оновлюємо локальну змінну
        this.settingsForm.get('meshOpacity')?.setValue(newOpacity); // Оновлюємо форму
    }





}
