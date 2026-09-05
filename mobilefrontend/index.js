import { registerRootComponent } from 'expo';

import App from './App';

// Registers App under the entry name "main", which is what both Expo Go and a
// standalone build look for. Exporting the component from App.js is not enough —
// without this call the runtime reports "App entry not found".
registerRootComponent(App);
