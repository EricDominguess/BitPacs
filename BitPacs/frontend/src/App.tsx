import { AppRouter } from './routes';
import { ThemeProvider, UnidadeProvider, ModalProvider, ViewerProvider } from './contexts';

function App() {
  return (
    <ThemeProvider>
      <UnidadeProvider>
        <ViewerProvider>
          <ModalProvider>
            <AppRouter />
          </ModalProvider>
        </ViewerProvider>
      </UnidadeProvider>
    </ThemeProvider>
  );
}

export default App;
