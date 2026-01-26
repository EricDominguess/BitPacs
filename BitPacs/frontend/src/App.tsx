import { AppRouter } from './routes';
import { ThemeProvider } from './contexts';

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
