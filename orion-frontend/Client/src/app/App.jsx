

import ParticleBackground from "../components/ParticleBackgroundAnimation";
import RouteManager from "../routes/RouteManager";
import { BrowserRouter } from "react-router-dom";
const App = () => {
  return (
    <BrowserRouter>
    <ParticleBackground/>
      <RouteManager />
    </BrowserRouter>
  );
};

export default App;