import { AppRouter } from './routes';
import { ThemeProvider, UnidadeProvider, ModalProvider } from './contexts';

function App() {
  return (
    <ThemeProvider>
      <UnidadeProvider>
        <ModalProvider>
          <AppRouter />
        </ModalProvider>
      </UnidadeProvider>
    </ThemeProvider>
  );
}

export default App;
