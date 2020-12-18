import React from 'react';
import { render } from '@testing-library/react';

import App from './App';
import {Provider} from "react-redux";
import store from "./combinedStore";

it('Mounts the App component without errors', () => {
  const { getByText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect(getByText).toBeInTheDocument();
});
