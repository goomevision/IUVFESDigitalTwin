import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ScientificExperimentFlow from "@/pages/ScientificExperimentFlow";
import ExperimentReplay from "./pages/ExperimentReplay";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const GITHUB_PAGES_BASE = "/IUVFESDigitalTwin";

function Router() {
  const routerBase =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith(`${GITHUB_PAGES_BASE}/`)
      ? GITHUB_PAGES_BASE
      : "";

  return (
    <WouterRouter base={routerBase}>
      <Switch>
        <Route path="/" component={ScientificExperimentFlow} />
        <Route path="/experiment" component={ScientificExperimentFlow} />
        <Route path="/replay/:experimentId" component={ExperimentReplay} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
