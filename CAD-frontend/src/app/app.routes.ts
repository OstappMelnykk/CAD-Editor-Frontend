import {Routes} from '@angular/router';
import {authGuard} from './core/guards/auth.guard';
import {EditorComponent} from './features/editor/components/editor/editor.component';
import {
    EditorWorkspaceComponent
} from './features/editor/editor-workspace/components/editor-workspace/editor-workspace.component';
import {
    EditorAdvancedSettingsComponent
} from './features/editor/editor-advanced-settings/components/editor-advanced-settings/editor-advanced-settings.component';
import {DesignComponent} from './features/editor/editor-workspace/components/settings-panel/design/design.component';
import {
    DivisionComponent
} from './features/editor/editor-workspace/components/settings-panel/division/division.component';
import {ViewComponent} from './features/editor/editor-workspace/components/settings-panel/view/view.component';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'editor',
        pathMatch: 'full'
    },
    {
        path: 'home',
        loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
    },
    {
        path: 'about',
        loadChildren: () => import('./features/about/about.module').then(m => m.AboutModule),
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    },
    {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
        canActivate: [authGuard],
    },
    {
        path: 'editor',
        component: EditorComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'editor-workspace',
                pathMatch: 'full',

            },
            {
                path: 'editor-workspace',
                component: EditorWorkspaceComponent,
                children: [
                    {
                        path: '',
                        redirectTo: 'design',
                        pathMatch: 'full',

                    },
                    {
                        path: 'design',
                        component: DesignComponent,
                    },
                    {
                        path: 'division',
                        component: DivisionComponent,
                    },
                    {
                        path: 'view',
                        component: ViewComponent,
                    }
                ]

            },
            {
                path: 'editor-advanced-settings',
                component: EditorAdvancedSettingsComponent,
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];
