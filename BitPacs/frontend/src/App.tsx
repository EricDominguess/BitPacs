import { AppRouter } from './routes';
import { ThemeProvider, UnidadeProvider } from './contexts';

function App() {
  return (
    <ThemeProvider>
      <UnidadeProvider>
        <AppRouter />
      </UnidadeProvider>
    </ThemeProvider>
  );
}

export default App;
