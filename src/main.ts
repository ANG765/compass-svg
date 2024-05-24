import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { CompassComponent } from './app/app.component';

bootstrapApplication(CompassComponent, appConfig)
  .catch((err) => console.error(err));
