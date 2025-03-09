import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {GlobalVariablesService} from './global-variables.service';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
@Injectable({
    providedIn: 'root'
})
export class InitService {


    constructor(private globalVariablesService: GlobalVariablesService) { }

    public init(canvas: HTMLCanvasElement) {
        if (!canvas)
            throw new Error('Canvas element is not provided for initialization.');

        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x654A8E, linewidth: 0.2 });
        const gridHelper = new THREE.GridHelper(50, 50, 0xaaaaaa, 0xaaaaaa);
        gridHelper.position.y = -4;
        gridHelper.material = gridMaterial;


        const _canvas = canvas;

        const _scene = new THREE.Scene();
        _scene.background = new THREE.Color(0x212831);
        _scene.add(gridHelper);
        _scene.add(new THREE.AxesHelper(30));

        const _camera = new THREE.PerspectiveCamera(75, _canvas.width / _canvas.height, 0.1, 1000);
        _camera.position.set(0, 0, 10);
        _camera.lookAt(0, 0, 0);

        const _renderer = new THREE.WebGLRenderer({canvas: _canvas, antialias: true});
        _renderer.setSize(_canvas.clientWidth, _canvas.clientHeight);

        const _orbitControls = new OrbitControls(_camera, _renderer.domElement);
        _orbitControls.target.set(0, 0, 0);
        _orbitControls.update();

        const animate = () => {
            requestAnimationFrame(animate);
            if (_camera &&
                _renderer &&
                _scene) {
                _renderer.render(_scene, _camera);
            }
        };
        animate();

        this.globalVariablesService.set('canvas', _canvas);
        this.globalVariablesService.set('scene', _scene);
        this.globalVariablesService.set('camera', _camera);
        this.globalVariablesService.set('renderer', _renderer);
        this.globalVariablesService.set('orbitControls', _orbitControls);
    }
}
