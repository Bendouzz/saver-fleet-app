import { render, screen } from '@testing-library/react';
import App from './App';

test("affiche l'écran de connexion", () => {
  render(<App />);
  expect(screen.getByText(/saver fleet ops/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
});
